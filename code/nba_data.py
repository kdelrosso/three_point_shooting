#!/usr/bin/env python

from __future__ import division
import sys
from os import path
sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))
import pandas as pd
from sqlalchemy import create_engine
from nba_py import player
from utils.db_utils import sql_to_csv

ENGINE = create_engine('postgresql://kdelrosso@localhost:5432/nba')
GAME_LOGS_TABLE_NAME = 'game_logs'
PLAYERS_TABLE_NAME = 'players'
SEASON_TOTALS_TABLE_NAME = 'season_totals'
START_YEAR = 1950
END_YEAR = 2017

def nba_seasons(year_min, year_max):
    """Return array of strings from year_min to year_max in the format '2016-17'."""

    years = list( range(year_min, year_max, 1) )
    seasons = []
    for y in years:
        next_year = str(y + 1)[-2:]
        seasons.append('{0}-{1}'.format(y, next_year))
    return seasons

def all_player_ids():
    """Return array of all player_ids."""

    df_players = player.PlayerList(league_id='00', only_current=0).info()
    return df_players['PERSON_ID'].values

def player_ids_for_season(season):
    """Return array of player_ids for the given season."""

    df_players = player.PlayerList(league_id='00', season=season, only_current=1).info()
    return df_players['PERSON_ID'].values

def game_logs(player_id, season, season_type):
    """Return game log info for the given player as a DataFrame."""

    return player.PlayerGameLogs(player_id, league_id='00', season=season, season_type=season_type).info()

def all_game_logs(player_ids, season, season_type):
    """Return the game logs for all players as a DataFrame."""

    df = pd.concat( [game_logs(pid, season, season_type) for pid in player_ids] )

    df['SEASON_ID'] = pd.to_numeric(df['SEASON_ID'], errors='coerce')
    df['GAME_DATE'] = pd.to_datetime(df['GAME_DATE'])
    df.columns = df.columns.str.lower()
    df.drop('video_available', inplace=True, axis=1)
    df.insert(0, 'season_type', season_type.lower().replace(' season', ''))
    df.insert(0, 'season', season)
    return df

def write_game_logs_to_database(df):
    """Write the game log DataFrame to the postgres database as a new table."""

    df.to_sql(GAME_LOGS_TABLE_NAME, ENGINE, if_exists='append', index=False)

def write_players_to_database():
    """Write the players info DataFrame to the postgres database as a new table."""

    df = player.PlayerList(league_id='00', season='2016-17', only_current=0).info()
    df.columns = df.columns.str.lower()
    df['lastname'], df['firstname'] = df['display_last_comma_first'].str.split(', ', 1).str
    to_keep = [
        'person_id',
        'firstname',
        'lastname',
        'from_year',
        'to_year'
    ]
    df = df.ix[:, to_keep].rename(columns={'person_id': 'id'})

    df.to_sql(PLAYERS_TABLE_NAME, ENGINE, if_exists='replace', index=False)

def regular_season_totals(player_id):
    """Return a player's regular season totals as a DataFrame."""

    return player.PlayerCareer(player_id, per_mode='Totals').regular_season_totals()

def post_season_totals(player_id):
    """Return a player's post season totals as a DataFrame."""

    return player.PlayerCareer(player_id, per_mode='Totals').post_season_totals()

def write_season_totals():
    """Write the season totals DataFrame to the postgres database as a new table."""

    player_ids = all_player_ids()
    reg_df = pd.concat( [regular_season_totals(pid) for pid in player_ids] )
    reg_df['season_type'] = 'regular'
    post_df = pd.concat( [post_season_totals(pid) for pid in player_ids] )
    post_df['season_type'] = 'playoffs'

    df = pd.concat([reg_df, post_df])
    df.columns = df.columns.str.lower()
    df.drop('league_id', inplace=True, axis=1)

    df.to_sql(SEASON_TOTALS_TABLE_NAME, ENGINE, if_exists='replace', index=False)

def write_data_to_postgres():
    """Write player, season totals, and game logs data to postgres."""

    print 'Writing players data to database...'
    write_players_to_database()
    print 'Writing season totals to database...'
    write_season_totals()

    print 'Writing game logs to database...'
    seasons = nba_seasons(START_YEAR, END_YEAR)
    season_types = ['Regular Season', 'Playoffs']

    for i, s in enumerate(seasons):
        player_ids = player_ids_for_season(s)
        for st in season_types:
            df = all_game_logs(player_ids, s, st)
            write_game_logs_to_database(df)

if __name__ == "__main__":
    # write_data_to_postgres()
    sql_to_csv('./three_point_shooting.sql', '../data/three_point_shooting_2.csv')

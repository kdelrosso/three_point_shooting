# Overview

An interactive data visualization created with D3 to explore NBA [three-point shooting.](http://kdelrosso.github.io/three_point_shooting/index.html)

## Getting the data

Setup the postgres database using

```
$ psql -c "DROP DATABASE IF EXISTS nba;"
$ psql -c "CREATE DATABASE nba;"
```

Download data from the `nba_py` API, insert into the nba database, and save the `three_point_shooting.sql` query results to .csv by running

```
$ python nba_data.py
```

## Visualization

The interactive visualization shows the total number of three-point field goals made (fg3m). The chart defaults to show fg3m by *Regular Season* and *Year*, but can be changed to show fg3m in the *Playoffs* or by *Season Number* (e.g. Season Number = 1 means fg3m in a player's first NBA season). Active players are shown in blue while retired players in gray / black.

This chart was motivated by [Why Peyton Manning's Record Will Be Hard to Beat](https://www.nytimes.com/interactive/2014/10/19/upshot/peyton-manning-breaks-touchdown-passing-record.html)
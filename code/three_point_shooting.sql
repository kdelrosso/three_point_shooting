with player_scoring_by_season as (
  select
    player_id,
    firstname,
    lastname,
    st.season_id,
    (substring(st.season_id, 0, 5) || '-12-31')::date as season_ts,
    sum(case when season_type = 'regular' then coalesce(fg3m::float, 0) else 0 end) as regular_fg3m,
    sum(case when season_type = 'regular' then coalesce(pts::float, 0) else 0 end) as regular_pts,
    sum(case when season_type = 'playoffs' then coalesce(fg3m::float, 0) else 0 end) as playoffs_fg3m,
    sum(case when season_type = 'playoffs' then coalesce(pts::float, 0) else 0 end) as playoffs_pts
  from season_totals st
  join players p
  on st.player_id = p.id
  where team_id != 0 -- removed TOT row when players change teams mid season
  group by 1,2,3,4,5
),
fill_zeros_before_first_year as (
  select
    player_id,
    firstname,
    lastname,
    extract(year from (min(season_ts) - '1 year'::interval)) || '-' || substring(extract(year from min(season_ts))::varchar, 3, 4) as season_id,
    min(season_ts) - '1 year'::interval as season_ts,
    0 as regular_fg3m,
    0 as regular_pts,
    0 as playoffs_fg3m,
    0 as playoffs_pts
  from player_scoring_by_season
  group by 1,2,3
),
union_player_scoring as (
  select * from player_scoring_by_season
  union all
  select * from fill_zeros_before_first_year
),
cum_scoring as (
  select
    *,
    sum(regular_fg3m) over (partition by player_id order by season_ts rows unbounded preceding) as total_regular_fg3m,
    sum(regular_pts) over (partition by player_id order by season_ts rows unbounded preceding) as total_regular_pts,
    sum(playoffs_fg3m) over (partition by player_id order by season_ts rows unbounded preceding) as total_playoffs_fg3m,
    sum(playoffs_pts) over (partition by player_id order by season_ts rows unbounded preceding) as total_playoffs_pts,
    (row_number() over (partition by player_id order by season_ts)) - 1 as season_number
  from union_player_scoring
),
rank_each_year_helper as (
  select
    player_id,
    total_regular_fg3m,
    season_id,
    dense_rank() over(partition by season_id order by regular_fg3m desc) as season_3rnk,
    max(total_regular_fg3m) over(partition by player_id) as career_3m_regular,
    max(total_playoffs_fg3m) over(partition by player_id) as career_3m_playoffs,
    max(total_regular_pts) over(partition by player_id) as career_pts_regular,
    max(total_playoffs_pts) over(partition by player_id) as career_pts_playoffs
  from cum_scoring
  where total_regular_fg3m > 0
),
rank_each_year as (
  select
    *,
    dense_rank() over(order by career_3m_regular desc) as regular_3rnk,
    dense_rank() over(order by career_3m_playoffs desc) as playoff_3rnk,
    dense_rank() over(order by career_pts_regular desc) as regular_pts_rnk,
    dense_rank() over(order by career_pts_playoffs desc) as playoffs_pts_rnk
  from rank_each_year_helper
),
top_players as (
  select distinct player_id
  from rank_each_year
  where (season_3rnk <= 10)
  or (regular_3rnk <= 100)
  or (playoff_3rnk <= 50)
  or (regular_pts_rnk <= 100)
  or (playoffs_pts_rnk <= 50)
)

select *
from cum_scoring
where player_id in (
  select * from top_players
  union all select 787 -- Charles Barkley
  union all select 77142 -- Magic
  union all select 893 -- Jordan
  union all select 1122 -- Dominique
)
and season_ts >= '1978-12-31'::date
;
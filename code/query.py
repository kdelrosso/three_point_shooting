import sys
from os import path
sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

from utils.db_utils import save_query_to_csv

def sql_to_csv(sql_filename, csv_filename):
    """Save sql query as csv

    Parameters
    ----------
    filename: string, .sql file containing a query
    """

    with open(sql_filename, 'r') as f:
        query = f.read()

    save_query_to_csv(query, csv_filename)


if __name__ == '__main__':
    sql_to_csv('./queries/three_point_shooting.sql',
        '../visualizations/three_point_shooting/data/three_point_shooting.csv')

    # sql_to_csv('./queries/three_point_shooting_playoffs.sql',
    #     '../visualizations/three_point_shooting/data/three_point_shooting_playoffs.csv')

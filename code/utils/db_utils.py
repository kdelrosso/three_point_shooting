import pandas as pd
import psycopg2

def setup_nba_connection():
    """Return a connection to the nba database."""

    conn = psycopg2.connect(dbname='nba',
                            user='kdelrosso',
                            port='5432',
                            host='localhost')
    return conn

def run_query(query):
    """Return the query results as a pandas DataFrame.

    Parameters
    ----------

    query: string, sql code to execute
    """

    conn = setup_nba_connection()
    df = pd.read_sql(query, conn)
    conn.close()

    return df

def save_query_to_csv(query, filename):
    """Save the query results to disk as csv.

    Parameters
    ----------

    query: string, sql code to execute
    filename: string, location to save query results
    """

    df = run_query(query)
    df.to_csv(filename, index=False)
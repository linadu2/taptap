#!/bin/python3

import subprocess
from dotenv import load_dotenv
import os
import sys

def run_sql_commands(sql_commands):
    # Load environment variables from root.env file
    load_dotenv(dotenv_path="db/root.env")

    user = "root"
    password = os.getenv("MARIADB_ROOT_PASSWORD")
    host = "172.20.0.3"
    database = "taptapdb"

    if not password:
        print("Missing database credentials in root.env file")
        return

    try:
        command = [
            "mysql",
            f"-u{user}",
            f"-p{password}",
            f"-h{host}",
            database
        ]

        process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        stdout, stderr = process.communicate(input=sql_commands)

        if process.returncode == 0:
            print("SQL command(s) executed successfully:")
            print(stdout)
        else:
            print("Error executing SQL command(s):")
            print(stderr)

    except Exception as e:
        print(f"An error occurred: {e}")


if len(sys.argv) != 3:
    print("Usage: python script.py <mode> <temp>")
    sys.exit(1)

else:
    mode = sys.argv[1]
    temp = sys.argv[2]

    if temp not in ["10S", "30S", "60S"] or mode not in ["Normal", "Sans Malus", "0 Vie"]:
        print('error')
        sys.exit(0)

    sql_commands = f"""
    UPDATE leaderboard as l
    JOIN modes as m on m.modesID = l.modesID
    JOIN temps as t on t.tempsID = l.tempsID
    SET l.pseudo = NULL, l.score = NULL
    WHERE m.modes = '{mode}' AND t.temps = '{temp}';
    """

    run_sql_commands(sql_commands)
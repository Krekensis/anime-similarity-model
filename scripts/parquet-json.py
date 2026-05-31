import pandas as pd

# Read the Parquet file
df = pd.read_parquet('./scripts/anime_db.parquet', engine='pyarrow')

# Convert DataFrame to JSON and save to a file
df.to_json('./scripts/anime_db.json', orient='records', lines=True)

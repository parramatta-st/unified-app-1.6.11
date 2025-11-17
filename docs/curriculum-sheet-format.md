# Curriculum Google Sheet format

When exporting curriculum data from Google Sheets for the app’s curriculum API, use a worksheet with the following column headers in this exact order:

1. `year`
2. `subject`
3. `strand`
4. `lesson`
5. `topic`
6. `template1`
7. `template2`
8. `template3`

Each subsequent row should provide values for those columns. Leave template columns blank if the lesson does not require them; the API should still ingest the row as long as the first five fields are populated.

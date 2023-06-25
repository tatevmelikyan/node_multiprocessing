# node_multiprocessing

Run **npm start** to run the app on port 3000.

Make a **POST** request to the following link _http://localhost:3000/exports_ with body **'csv-files'** to convert all .csv files to .json files.

Make a **GET** request to the following link _http://localhost:3000/files_ to get all .json file names.

Make a **GET** request to the following link _http://localhost:3000/files/:filename_ to get a specific .json file content.

Make a **DELETE** request to the following link _http://localhost:3000/files/:filename_ to delete a specific file.

## Build API

1) Go to the ServerSide folder
2) run `docker build -t renestadler/highscoreapi .`

## Build Website
1) Go to the ClientSide folder
2) run `docker build -t renestadler/highscorefrontend .`
 
## Run it with docker compose

Now, you just need to start docker compose 
`docker compose up`

The API is now available at port 5000 and the frontent at port 8080
## Halin Neo4j Monitoring

The beginnings of a database monitoring tool, as a GraphApp.

Built with `create-react-app` and uses [graph-app-kit](https://github.com/neo4j-contrib/graph-app-kit) components to display their usage.  

This app assumes that it runs where the Neo4j Desktop API is available.

This app works on local db:s with no auth, or on remote connections (with or without auth).

## Screenshot

![Halin Screenshot: Performance](img/performance.png "Halin Screenshot")

![Halin Screenshot: Advisor](img/advisor.png "Halin Screenshot")

## Commands
 
```
# Install deps
yarn install

# Start app locally
yarn start
```

## Serve in Neo4j Desktop env
To serve it as a graph application, read the docs for that in the Neo4j Desktop development pages.

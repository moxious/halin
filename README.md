## Halin Neo4j Monitoring

Halin is a Graph App for monitoring your Neo4j instance, or cluster.  It works with both
single instance graphs (like those you create in Desktop) and also remote connections to 
Causal Clusters.

Primary features:
1. Basic performance monitoring (system load, memory usage)
2. Advisor and Diagnostics:  Checks your Neo4j configuration and finds problems, makes suggestions on how to improve.
3. User & Role Management: allows you to administer users & roles across any number of machines.

## Running Halin in Development Mode

1. Clone the repo
2. `yarn install`
3. `yarn start`
4. Inside of Neo4j Desktop, go to application settings, scroll all the way to the bottom, enable development mode
5. For development app entry point, use http://localhost:3000/ (that's where yarn start will serve the app)
6. For development app root path, enter /absolute/path/to/halin where you cloned the repo
7. Finally, inside of desktop you'll see a special tile labeled "Development App 9.9.9".  This will
point to your running copy of Halin

## Installing Halin

**Neo4j Desktop minimum version 1.1.10 is required.**

1. Open Neo4j Desktop
2. Click on the "Graph Applications" tile at left
3. Scroll to the bottom where it says "Install Graph Application"
4. Enter the URL `https://neo.jfrog.io/neo/api/npm/npm/halin` into the box
5. Click install

That's it.  As Neo4j Desktop is installed, and as new versions of Halin are available,
you'll catch updates.

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

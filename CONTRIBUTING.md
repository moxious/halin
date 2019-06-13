## Contributing to Halin

Contributions to Halin are welcome, of all sorts:

- Better documentation
- Pull requests of code
- Issue submissions and issue fixes

The remainder of this file is intended to serve as a
set of notes for how Halin is put together, to aid 
contributions.

## Design Notes

This is a short overview of how Halin is put together, with hopes that it's useful for those
hacking on it or wanting to extend it.

The entirety of the application is broken into two trees:
- API, where all of the Neo4j, network, and datastructure parts reside, independent from Halin's
React-based UI, and 
- Components, where all react-based content lives.

### Core API Parts

#### HalinContext

The HalinContext class is a global and gets attached to the window object.  It always has an
array of ClusterMember instances.  Halin treats single-node databases as a cluster with only one
member.  The HalinContext also has a ClusterManager object it can create, which handles cluster-
wide operations, such as mapping queries across a cluster (user management).

#### Feature Probes

Both the HalinContext object and the ClusterMembers that it has have the concept of feature
probes; when Halin starts up it gathers basic information about which sorts of features are supported by the database, which version, enterprise vs. community, and so on.  In this way,
the UI can be adapted to a different layout depending on what the DB exposes and its version.

#### Query Library

Halin exposes a "Query Library" which centralizes all of the queries Halin runs, and the 
display columns used in the UI corresponding to the data that comes back from the server.

#### DataFeeds

A Datafeed is a polling data stream that requires a query, a set of display columns, and a rate.
The datafeed can notify the caller when new data is available, and can handle a variety of error
scenarios.  Most visual components in Halin are backed by a Datafeed object.

#### Driver Management

Neo4j driver management is done centrally.  Components are discouraged from creating drivers
or even using them. By using the ClusterMember object to run queries, we get to centrally manage
all of that and also track performance and errors.  Additionally, Halin uses "session pooling"
on top of the standard Neo4j driver.  This was introduced because session creation/destruction
requires extra roundtrips in the bolt protocol, and session reuse is desirable for improving
latency to/from Neo4j.

#### Error Reporting

Sentry is used throughout for error detection and reporting, and telemetry.

### React Parts

#### Higher-Order Components

Higher order components (HOCs) are provided which allow other components to express their
requirements.  For example, in order to display metrics, those metrics have to be enabled server side.  In order to administer users, you have to be using enterprise, and so on.

Each of the components then expresses requirements by wrapping themselves in a higher order 
component, or none, if they work anywhere.  This allows the HOC to check the various feature
probes in the API and selectively display components.

#### Key React Components

Most of the actual display components are quite straightforward; the most complex bits of Halin
are in dealing with how different the product surface for Neo4j is depending on the version
and available features that are exposed.

The key react components to have a look at are CypherDataTable, CypherTimeseries, and ClusterTimeseries.
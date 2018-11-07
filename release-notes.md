# Halin Release Notes

## 0.4.3

- Added Docker support. Halin can be built and run inside of docker.
- Fixed Neo4j Desktop bug that occurred when no database was active (#31)
- Added several suggestions from Dave Shiposh; heap size checking, page cache size checking (#29, #28)
- Disabled User Management tab when Neo4j cluster does not support native authentication (#27)
- Improved freshness calculations for degrading connections
- Improved connection troubleshooting
- Key dependency updates

## 0.4.2

- Certain cluster lifecycle events (like leader re-elections) can be detected and seen in
the diagnostic tab
- Status icons (green/yellow/red) on the top tab bar showing responsiveness of each cluster node
- Better display/disabling for Neo4j Community, when components cannot be rendered. Some functions
do not apply to enterprise.
- Documentation and license on repo.

## 0.4.1

- Support for Neo4j Community!  Albeit with some components disabled whose data is not available outside of Enterprise
- Selectively disable certain components when user lacks the 'admin' role, rather than breaking badly
- Sentry integration for tracking errors encountered
- Fixed edge case bugs where certain kinds of JMX queries do not
return any records in Neo4j Community

## 0.4.0

- Introduced the concept of a cluster timeseries, showing one data element for all nodes
in the cluster.
- Based on that, added a Cluster Overview tab with cluster timeseries for heap size,
GC pause, page cache faults, transactions open, used memory, file descriptors, and others,
following templated Grafana dashboards suggested by DGordon.
- Introduced the concept in Diagnostics of a "Configuration Diff Tool" allowing users to
quickly find where configuration disagrees across all nodes of the cluster.
- Data feed stats on the settings page

## 0.3.1

Bugfixes

- Issue #14: systems which don't have swap memory show an eternal loading spinner
- Issue #13: time windows are inappropriately reset when switching between tabs

## 0.3.0

- Fix issue #10; 127.0.0.1 backups are not recognized as local
- Improved timeseries moving window behavior
- Added an OS sub-window with operating system memory statistics

## 0.2.0

- New disk usage timeseries monitor
- Bugfix: you can't escape the first connection modal.

## 0.1.1

- Halin can now run independent of Neo4j Desktop as a web app. (`yarn start`)
- Scripts to deploy to AWS S3
- Whether or not cluster connections are encrypted depends on Desktop settings
and user preference via the connection dialog

## 0.1.0

Lots and lots of GraphConnect 2018 Feedback

- Promoted User Management to cluster-wide operations
- Added links to configuration entries reference documentation
- Removed passwords and sensitive information from diagnostic dumps
- Added "Ping" component to diagnostic page to measure round-trip times
- Changed download diagnostic package button to be more clear
- Initialize cluster connections on startup for better performance
- Advisor results come broken out by machine
- Added checking for backup status, network security to advisor
- Added app footer with link to the page

## 0.0.7

- Fixed several issues with package.json
- Corrected icon path

## 0.0.6

- Icons and package.json formatting to make Halin play
- nicely with the Neo4j Desktop UI

## 0.0.5

- first working published version

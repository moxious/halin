# Halin Release Notes

## 0.7.2

- Fixes an issue identified where incorrect roles were reported

## 0.7.1

- Fixes #55; removes DBcount component and institutes a new plugins / CypherSurface 
component to consolidate view of functions and procedures
- Fixes #54; adds an "Other" column to store file size tracking, to indicate when
users have extraneous files in their graph.db folders that are taking up space. Thanks
to @dfgitn4j for the suggestion.

## 0.7.0

- (Optional opt-in) you may report diagnostic information to help improve Halin & Neo4j
- Centralize driver error handling
- Fixes #51, #48 - Halin errors on dbms.security.auth_enabled=false
- Fixes #49 - Halin errors in some cases when a non-admin user is used for login
- Fixes data display issues in the store file sizes component to make them human readable
- Fixes bug where address of machine involved in role changes did not update properly

## 0.6.0

- Halin can now gather diagnostics and render advice about Neo4j Community
- The user management pane now works for Neo4j Community (no longer just enterprise)
- Improvements to the diagnostic data format, and better tracking of node performance.

## 0.5.2

- Bugfixes: #40, #41, #42, #44

## 0.5.1

- Hotfix release for deploy errors

## 0.5.0

- Bugfixes to support Neo4j 3.5.0 (#38) community & enterprise.
- Fixes browser compatibility issues for older browsers (#36)
- Via `npm run gather` it is now possible to gather diagnostics non-interactively.
- Fixed page cache advisor bug where certain memory values were mis-identified.
- Improved diagnostic output to include kernel version number and native auth support information for each cluster node
- Added diagnostic rule to detect version consistency amongst machines in a cluster.
- Added the basics of a CircleCI build system

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

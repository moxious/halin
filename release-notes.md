# Halin Release Notes

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

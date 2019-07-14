/**
 * A database is a graph that can be stored within Neo4j.
 * 
 * Multi-database starts with Neo4j >= 4.0.  For versions of Neo4j prior to 4,
 * the HalinContext will fake a single database.
 */

 export default class Database {
     constructor(name, status, isDefault=false) {
         this.name = name;
         this.status = status;
         this.isDefault = isDefault;
     }

     getLabel() { 
         return this.name;
     }

     getStatus() {
         return this.status;
     }

     isOnline() { return this.status === 'online'; }
 };
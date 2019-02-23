# Integration Testing

This is one of the hardest parts of Halin, because there are so many possible combinations:

- Neo4j Community vs. Enterprise
- Auth configured vs. No-Auth
- Native auth vs. Non-Native Auth (i.e. LDAP)
- v3.4 vs. v3.5 (which have different procedure signatures)
- Admin user, vs. non-admin user (who are permitted to see/do different things)

## Approach

I'm trying to harden Halin so that at worst it would show you something blank, or that something
was not supported, rather than just coughing and dying.  But at a minimum prior to releases,
we'll run through basic functional testing on the following setups:

- Multi-node causal cluster, 3.5 series
- Single node Desktop install (typical of what many users will see with a GraphApp) both 3.4 and 3.5
- Community deployed in a docker instance


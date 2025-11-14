db, vpc, kms, sqs, should all be defined here

sst imports them separately

this file is supposed to be all in 1 iac to stand up an environment

db should have an option to be replicatd from somehwere, else create a new one

it should also start the first sst. all subsequent sst deployments should be doen via ci

any changes to this file should trigger a full redeploy

resources must be marked as no delete on stack removal UNLESS specifically overridden

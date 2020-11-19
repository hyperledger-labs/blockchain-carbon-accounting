# blockchain-carbon-accounting

This repository contains the code for the [Hyperledger Carbon Accounting and Neutrality Working Group](https://wiki.hyperledger.org/display/CASIG/Carbon+Accounting+and+Certification+Working+Group).  Each
sub-folder is for a different project of the Working Group and has its own code and instructions:

 * utility-emissions-channel: [Utility Emissions Channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel)

## Git Notes

Now that we're part of hyperledger-labs, you will need to checkout to your own branch and create pull requests::

 $ git checkout -b <your-branch>
 // make your changes, then commit with a sign-off using the -s
 $ git commit -s -m "your message"
 $ git push origin <your-branch>

Then you will need to create a pull-request, either by going to `https://github.com/hyperledger-labs/blockchain-carbon-accounting/pulls` or in the command line with

 $ hub pull-request -m "message about your pull request"

See https://hub.github.com/hub-pull-request.1.html.  You may also have to set up `hub` with `brew install hub` and get a token from github https://github.com/settings/tokens.

The pull request must be reviewed and approved by a different committer than yourself. 

Once the pull request is approved, you can go in and squash and merge into the master branch.  Then merge it back to your branch with::

 $ git fetch
 $ git merge origin/master

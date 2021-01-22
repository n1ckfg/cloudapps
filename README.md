# cloudapps
heroku cloud apps, one branch per app please. rationale: the mischmasch project has required several cloud apps to be deployed (in lieu of webRTC working properly, for instance), but instead of making a *monorepo* **per app**, it's easier to keep them tidy within one *manyrepo*

After creating a new branch, you need to switch to it, then:

1. set the heroku upstream:
```heroku git:remote -a name-of-heroku-app```

2. set the worldmaking org's github upstream (for version tracking)
```git push -u origin <branchname>```

Then, to push from a branch to its corresponding heroku app repo, use
```git push heroku <branchname>:master```


# branches/apps

mischmasch-userdata
mischmasch-host

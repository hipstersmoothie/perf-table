# Package Starter

This is a project that has all the tools I use set up so I can get straight to coding.

Tools Used:

* lint - [XO](https://github.com/xojs/xo) - Opinionated but configurable ESLint wrapper with lots of goodies included.
* test - [jest](https://github.com/facebook/jest) - Delightful JavaScript Testing. 
* build - [babel](https://github.com/babel/babel) - A compiler for writing next generation JavaScript.
* formatting - [prettier](https://github.com/prettier/prettier) - An opinionated code formatter. This will format your code on commit.
* release - [github-semantic-version](https://github.com/ericclemmons/github-semantic-version) - Automated semantic version releases powered by Github Issues.

## Setup

First start off by cloning this repo and setting the `origin` to your own repo.

```sh
git clone https://github.com/hipstersmoothie/package-starter
git remote rm origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_GITHUB_REPO.git
git push -u origin master
```

### Package.json

1. Change `name` to your package name.
2. Change `description` to describe your package.
3. Change `author.name` to your name.
4. Change `author.email` to your email.
5. Change `repository.url` to your github repo.

### License

1. Change `<YEAR>` to current year. Update this as the years pass.
2. Change `<COPYRIGHT HOLDER>` to your name.

### Github Config

1. Add `major` label.
2. Add `minor` label.
3. Add `patch` label.
4. Add `internal` label.
5. Change `README.md` to your project's README.

### CircleCI Config

Un-comment `publish` blocks when you are ready to start publishing

1. Replace all instances of `package-starter` in `.circleci/config.yml` with your package name.
2. Go to `https://circleci.com/gh/YOUR_USERNAME`
3. Click Authorize (if you haven't already)
4. Click 'Add Projects' on the left sidebar.
5. Click 'Set Up Project' for 'YOUR_PACKAGE_NAME'.
6. Click 'Start Building'.
7. Go to 'YOUR_PACKAGE_NAME' project in CircleCI.
8. Click cog icon in top corner.
9. Click `advanced settings`.
10. Turn on 'Build forked pull requests'.
11. Turn on 'Only build pull requests'.
12. Add environment variable `GH_TOKEN` in CircleCI settings. (personal access token from github)
13. Add environment variable `NPM_TOKEN` in CircleCI settings. (publishing token from npm)

## All Done!

Now you are set up to develop your package. Each pull request will be released once it is merged to master.


<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

# \*\* No longer in development\*\*

The author of this plugin no longer owns an LG air conditioner. Further contributions will not be accepted, but forks are encouraged.

**Thank you** to all who helped maintain, report bugs, and make this plugin be possible over the past 4 years! It was a very fun side project and learning experience.

If this plugin breaks, you may want to search for other "LG" plugins: https://www.npmjs.com/search?q=keywords%3Ahomebridge-plugin%20lg


<hr />
<hr />
<hr />


# homebridge-lg-thinq-ac

<p>
  <a href="https://www.npmjs.com/package/homebridge-lg-thinq-ac" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/homebridge-lg-thinq-ac.svg">
  </a>
  <a href="https://github.com/sman591/homebridge-lg-thinq-ac/actions">
    <img alt="Release" src="https://github.com/sman591/homebridge-lg-thinq-ac/workflows/Release/badge.svg">
  </a>
</p>


[Homebridge](https://homebridge.io) plugin for LG ThinQ-enabled portable air conditioners.

**WARNING:** This has only been fully tested with the [LP1419IVSM](https://www.lg.com/us/air-conditioners/lg-LP1419IVSM-portable-air-conditioner) model. This may not work with all models.

Community members have reported the following models also work: LG PA11WS, LG S4NQ09WA51A.

## Installation guide

1. **Mobile app setup**
    * Set up the air conditioner using the "LG ThinQ" app ([iOS](https://apps.apple.com/us/app/lg-thinq/id993504342) | [Google Play](https://play.google.com/store/apps/details?id=com.lgeha.nuts&hl=en_US))
    * Ensure the air conditioner shows up in the app and responds to controls
    * Make sure you can sign in **without** "Sign In With Apple", such as with a traditional username + password

2. **Install the homebridge plugin**
    * `sudo npm -g i homebridge-lg-thinq-ac`

3. **Add platform to config.json**
    * *I highly recommend using [homebridge-config-ui-x](https://github.com/oznu/homebridge-config-ui-x) to make these changes*
    * Add the appropriate country & language code for your account
    * Add the following to your config (or merge with the `platforms` array if it exists):

    ```
    {
      "platforms": [
        {
          "platform": "LgThinqAirConditioner",
          "country_code": "US",
          "language_code": "en-US"
        }
      ]
    }
   ```

4. **Restart Homebridge**

5. **Log into your LG account**
    * Wait for Homebridge to start back up.
    * In the Homebridge Config UI, click the "Plugins" tab.
    * In the list of plugins, click "Settings" under "LG ThinQ Air Conditioner"
    * In the modal that pops up, find "Login URL". Copy & paste this URL into another browser tab.
    * Log into your LG account. You should be redirected to a blank page.
    * On the blank page, copy the URL address of that page and close the tab

6. **Paste back the returned URL**
    * Keeping the URL you copied at the end of Step 5, open the Homebridge Config UI
    * In the plugin settings, paste the URL into "Redirected URL"
    * Click "Save" and restart Homebridge

7. **Try it out!**
    * Wait for Homebridge to start back up
    * Open HomeKit on your device! You should now see your air conditioner pop up.

## Debugging

* If you have issues, review the Homebridge logs (found on the "status" page of the Homebridge Config UI).
* If you see `400` errors or otherwise suspect auth/login issues, clear all config values for the plugin, restart Homebridge, and follow the installation guide again.

## Setup Development Environment

To develop Homebridge plugins you must have Node.js 12 or later installed, and a modern code editor such as [VS Code](https://code.visualstudio.com/). This plugin template uses [TypeScript](https://www.typescriptlang.org/) to make development easier and comes with pre-configured settings for [VS Code](https://code.visualstudio.com/) and ESLint. If you are using VS Code install these extensions:

* [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

## Install Development Dependencies

Using a terminal, navigate to the project folder and run this command to install the development dependencies:

```
npm install
```

## Build Plugin

TypeScript needs to be compiled into JavaScript before it can run. The following command will compile the contents of your [`src`](./src) directory and put the resulting code into the `dist` folder.

```
npm run build
```

## Link To Homebridge

Run this command so your global install of Homebridge can discover the plugin in your development environment:

```
npm link
```

You can now start Homebridge, use the `-D` flag so you can see debug log messages in your plugin:

```
homebridge -D
```

## Watch For Changes and Build Automatically

If you want to have your code compile automatically as you make changes, and restart Homebridge automatically between changes you can run:

```
npm run watch
```

This will launch an instance of Homebridge in debug mode which will restart every time you make a change to the source code. It will the config stored in the default location under `~/.homebridge`. You may need to stop other running instances of Homebridge while using this command to prevent conflicts. You can adjust the Homebridge startup command in the [`nodemon.json`](./nodemon.json) file.

## Commit Message Format

Release notes are automatically generated by [semantic-release](https://semantic-release.gitbook.io/semantic-release/). Please follow the [Angular commit guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines) for formatting commit messages.

## Publish Package

New versions are automatically built, versioned, and published by [semantic-release](https://semantic-release.gitbook.io/semantic-release/). Every push to the `master` branch will trigger a release, with a version bump that respects the types of new commit(s) included.

## Versioning Your Plugin

Given a version number `MAJOR`.`MINOR`.`PATCH`, such as `1.4.3`, increment the:

1. **MAJOR** version when you make breaking changes to your plugin,
2. **MINOR** version when you add functionality in a backwards compatible manner, and
3. **PATCH** version when you make backwards compatible bug fixes.

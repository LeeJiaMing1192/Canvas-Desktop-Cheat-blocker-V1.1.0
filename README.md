# Canvas-Desktop-Cheat-blocker-V1.1.0
This is a canvas cheat blocker program build to handles extreme test use cases prevention 


this was written in Electron JS + C++ before modding this app you have to 


### How to include DLL's when you add in custom c++ codes

Use a Dependency Walker to scan for DLL's needed for your c++ code and upload it to the main folder 

#### Open package.json 

 "extraResources": 
 [
      {
        "from": "BackgroundManager.exe",
        "to": "BackgroundManager.exe"
      },
      {
        "from": "libgcc_s_dw2-1.dll",
        "to": "libgcc_s_dw2-1.dll"
      },
      {
        "from": "libstdc++-6.dll", // Heres an example of how to add in DLL's
        "to": "libstdc++-6.dll" // Heres an example of how to add in DLL's
      },
      {
        "from": "canvas_logo.png",
        "to": "canvas_logo.png"
      }
]


## Initial node Modules setup and configuration:

1. npm init 



2. npm install electron --save-dev //Install electron on your project folder





3. npm install electron-builder --save-dev //Intall electron builder to package 





## How to build and run project :

use *npm run start* for start testing on developement

use *npm run dist for* package everything and output out in the /dist folder


## Feel free to request merge commit and fixes when you wanted !

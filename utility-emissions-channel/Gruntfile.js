"use strict";

module.exports = function(grunt) {

    grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
         jshint: {
                 options: {
                    configuration: grunt.file.readJSON(".jshintrc"),
                    force: false,
                    fix: false
                },
            all: [
                "Gruntfile.js",
                "typescript/**/*.js",
                "docker-compose-setup/egrid-data-loader.js",
                "chaincode/node/**/*.js",
                "emissions_calc_test/test.js"
            ], 
        },
        
        
        tslint: {
                options: {
                    configuration: grunt.file.readJSON("tslint.json"),
                    force: false,
                    fix: false
                },
                files: {
                     src: ['typescript_app/**/*.ts', 'chaincode/typescript/**/*.ts', "!typescript_app/node_modules/**/*.ts"]
                    
                },
        },
        
       mochaTest: {
        test: {
           options: {
              reporter: 'spec',
              captureFile: 'results.txt', // Optionally capture the reporter output to a file
              noFail: false, // Optionally set to not fail on failed tests (will still fail on other errors)
           },
           src: ['typescript_app/tests/**/*.js']
         }
    },
    
      watch: {
          scripts: {
               files: ['typescript_app/**/*.ts', 'chaincode/typescript/**/*.ts', "!typescript_app/node_modules/**/*.ts"], 
               tasks: ["newer:jshint:files", "newer:tslint:files", "newer:mochaTest"],
               options: {
               spawn: false 
                   }
                 }
               }
         
          });
    
    
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-tslint");
    grunt.loadNpmTasks("grunt-mocha-test");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-newer");
    grunt.registerTask("default", ["jshint:all", "tslint:files", "mochaTest"]);
};

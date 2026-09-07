const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'./tests/e2e',timeout:45000,use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1280,height:900},trace:'retain-on-failure',screenshot:'only-on-failure'},webServer:{command:'node tests/server.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:false,timeout:15000},reporter:[['list'],['html',{open:'never'}]]});

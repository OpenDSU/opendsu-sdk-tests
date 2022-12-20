require("../../psknode/bundles/testsRuntime");

const tir = require("../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("Resolve conflicts when you have an older version and try to mount in it a new dsu", (testFinishCallback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keySSISpace = openDSU.loadApi("keyssi");

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, firstDSUInstance) => {
                if (err) {
                    throw err;
                }
                firstDSUInstance.getKeySSIAsObject((err, firstIdentifier)=>{
                    if(err){
                        throw err;
                    }

                    resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, secondDSUInstance) => {
                        if (err) {
                            throw err;
                        }
                        secondDSUInstance.getKeySSIAsObject((err, secondIdentifier)=> {
                            if (err) {
                                throw err;
                            }


                            resolver.invalidateDSUCache(firstIdentifier, ()=>{
                                if (err) {
                                    throw err;
                                }
                                resolver.invalidateDSUCache(secondIdentifier, ()=>{
                                    if (err) {
                                        throw err;
                                    }

                                    resolver.loadDSU(firstIdentifier, (err, firstDSUAfterLoad)=>{
                                        if (err) {
                                            throw err;
                                        }
                                        firstDSUAfterLoad.writeFile("/test", "test", (err)=>{
                                            if (err) {
                                                throw err;
                                            }
                                            resolver.invalidateDSUCache(firstIdentifier, (err)=> {
                                                if (err) {
                                                    throw err;
                                                }

                                                firstDSUInstance.mount("/mountingPoint", secondIdentifier.getIdentifier(), (err)=>{
                                                    if (err) {
                                                        throw err;
                                                    }

                                                    resolver.invalidateDSUCache(firstIdentifier, (err)=> {
                                                        if (err) {
                                                            throw err;
                                                        }

                                                        resolver.loadDSU(firstIdentifier.getIdentifier(), (err, firstDSUAfterLoad)=> {
                                                            if (err) {
                                                                throw err;
                                                            }
                                                            firstDSUAfterLoad.listFiles("/", (err, files)=>{
                                                                if (err) {
                                                                    throw err;
                                                                }
                                                                assert.true(files.length===4);
                                                                testFinishCallback();
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}, 100000000);
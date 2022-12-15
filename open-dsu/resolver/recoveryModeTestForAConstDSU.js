process.env.OPENDSU_ENABLE_DEBUG = true;
process.env.DEV = true;
const path = require("path");
const fs = require("fs");

require("../../../psknode/bundles/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;


function getBrickStorageFolder(folder) {
    return path.join(folder, "external-volume/domains/default/brick-storage");
}

function getBrickFilePath(folder, hashLink) {
    let brickFolderName = hashLink.slice(0, 5);
    let targetPath = path.join(getBrickStorageFolder(folder), brickFolderName, hashLink);
    console.log(targetPath);
    return targetPath;
}

function createDSU(enclave, callback){
    enclave.createTemplateSeedSSI("default", (err, templateSeed) => {
        if (err) {
            throw err;
        }

        enclave.createDSU(templateSeed, (err, dsu) => {
            if (err) {
                throw err;
            }

            dsu.getKeySSIAsObject((err, seed) => {
                if (err) {
                    throw err;
                }
                return callback(undefined, {seed, dsu});
            });
        });
    });
}

assert.callback("Create and load Const DSU test", (finishTest) => {
    double_check.createTestFolder('TEST', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require("opendsu");
            const EnclaveAPI = openDSU.loadApi("enclave");
            const keySSIApi = openDSU.loadApi("keyssi");
            const anchoring = openDSU.loadApi("anchoring");
            const resolver = openDSU.loadApi("resolver");
            const sc = openDSU.loadApi("sc");
            const anchoringX = anchoring.getAnchoringX();

            sc.getMainEnclave((err, enclave) => {
                keySSIApi.we_createArraySSI(undefined, "default", ["one", "two", "keys"], undefined, undefined, (err, arraySSI) => {
                    if (err) {
                        throw err;
                    }
                    enclave.createDSU(arraySSI, {useSSIAsIdentifier: true}, (err, constDSU) => {
                        if (err) {
                            throw err;
                        }
                        arraySSI.getAnchorId((err, anchorId) => {
                            if (err) {
                                throw err;
                            }

                            createDSU(enclave, (err, {seed, dsu})=>{
                                if (err) {
                                    throw err;
                                }

                                constDSU.mount("/code", seed, (err)=>{
                                    if(err){
                                        throw err;
                                    }

                                    anchoringX.getAllVersions(anchorId, (err, allVersions) => {
                                        if (err) {
                                            throw err;
                                        }

                                        for (let i = 0; i < allVersions.length; i++) {
                                            let brickFilePath = getBrickFilePath(folder, allVersions[i].getHash());
                                            let fileContent = fs.readFileSync(brickFilePath);
                                            console.log(fileContent.toString());
                                            fs.unlinkSync(brickFilePath);
                                        }

                                        let recoveryContentFnc = (dsu, callback) => {
                                            console.log("Content recovery function was called!");
                                            assert.true(typeof dsu !== "undefined", "restored failed");

                                            dsu.restored = true;

                                            dsu.mount("/code", seed, (err)=> {
                                                if(err){
                                                    throw err;
                                                }
                                                return callback(undefined, dsu);
                                            });
                                        };

                                        enclave.loadDSURecoveryMode(arraySSI, recoveryContentFnc, (err, recoveredDSU) => {
                                            if (err) {
                                                throw err;
                                            }

                                            assert.equal(recoveredDSU.restored, true, "Content recovery function wasn't called");
                                            recoveredDSU.listFiles("/", (err, files) => {
                                                if (err) {
                                                    throw err;
                                                }
                                                let expectedFiles = [
                                                    "code/dsu-metadata-log",
                                                    "manifest"
                                                ];

                                                assert.equal(files.length, expectedFiles.length, "Recovery failed");
                                                for (let i = 0; i < expectedFiles.length; i++) {
                                                    assert.true(files.indexOf(expectedFiles[i]) !== -1, "Recovery failed");
                                                }

                                                resolver.invalidateDSUCache(arraySSI, (err)=>{
                                                    if(err){
                                                        throw err;
                                                    }
                                                    resolver.loadDSU(arraySSI, {skipCache: true}, (err, newRef)=>{
                                                        if(err){
                                                            throw err;
                                                        }

                                                        newRef.listFiles("/", (err, files)=>{
                                                            if(err){
                                                                throw err;
                                                            }

                                                            for (let i = 0; i < expectedFiles.length; i++) {
                                                                assert.true(files.indexOf(expectedFiles[i]) !== -1, "Recovery failed");
                                                            }
                                                            finishTest();
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

}, 100000);
process.env.OPENDSU_ENABLE_DEBUG = true;
const path = require("path");
const fs = require("fs");

require("../../../psknode/bundles/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;


function getBrickStorageFolder(folder){
    return path.join(folder, "external-volume/domains/default/brick-storage");
}

function getBrickFilePath(folder, hashLink){
    let brickFolderName = hashLink.slice(0, 5);
    return path.join(getBrickStorageFolder(folder), brickFolderName, hashLink);
}

assert.callback("Create and load DSU test", (finishTest) => {
    double_check.createTestFolder('TEST', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require("opendsu");
            const EnclaveAPI = openDSU.loadApi("enclave");
            const anchoring = openDSU.loadApi("anchoring");
            const sc = openDSU.loadApi("sc");
            const anchoringX = anchoring.getAnchoringX();

            sc.getMainEnclave((err, enclave)=>{
                enclave.createTemplateSeedSSI("default", (err, templateSeed)=>{
                    if(err){
                        throw err;
                    }

                    enclave.createDSU(templateSeed, (err, dsu)=>{
                        if(err){
                            throw err;
                        }

                        dsu.getKeySSIAsObject((err, seed)=>{
                            if(err){
                                throw err;
                            }

                            console.log("============================", seed.getIdentifier(true));
                            /*dsu.writeFile("/test.txt", "just content", (err)=>{
                                if(err){
                                    throw err;
                                }*/

                                /*dsu.writeFile("/secondfile.txt", "content that will be deleted from brick storage", (err)=>{
                                    if(err){
                                        throw err;
                                    }*/
setTimeout(()=>{
    seed.getAnchorId((err, anchorId)=>{
        anchoringX.getAllVersions(seed, (err, allVersions)=> {
            if (err) {
                throw err;
            }

            for (let i = 0; i < allVersions.length; i++) {
                let brickFilePath = getBrickFilePath(folder, allVersions[i].getHash());
                fs.unlinkSync(brickFilePath)
            }


            enclave.loadDSURecoveryMode(seed, (dsu, callback) => {
                console.log("Content recovery function was called!");
                if (dsu) {
                    dsu.restored = true;
                    return callback(undefined, dsu);
                }
            }, (err, recoveredDSU) => {
                if (err) {
                    throw err;
                }

                //assert.equal(recoveredDSU.restored, true, "Content recovery function wasn't called");
                recoveredDSU.listFiles("/", (err, files) => {
                    if (err) {
                        throw err;
                    }
                    assert.equal(files.length, 1, "Recovery failed");
                    finishTest();
                });
            });


        });
    });

}, 3000);

                                //});
                            /*});*/

                        });
                    });

                });
            });
        });
    });
}, 100000);
require("../../../builds/output/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("mount - mount dossier inside a folder of a mounted dossier", (testFinishCallback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }

            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keySSISpace = openDSU.loadApi("keyssi");

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, rawDossier) => {
                if (err) {
                    throw err;
                }

                resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), async (err, dossier1) => {
                    if (err) {
                        throw err;
                    }

                    await dossier1.safeBeginBatchAsync();
                    dossier1.writeFile('/folder1/file1.txt', 'text', async (err) => {
                        if (err) {
                            throw err;
                        }

                        await dossier1.commitBatchAsync();
                        dossier1.getKeySSIAsString(async (err, keySSI) => {
                            if (err) {
                                throw err;
                            }

                            await rawDossier.safeBeginBatchAsync();
                            rawDossier.mount('/folder1/dossier1', keySSI, async (err) => {
                                if (err) {
                                    throw err;
                                }

                                await rawDossier.commitBatchAsync();
                                rawDossier.listMountedDossiers('', (err, content) => {
                                    if (err) {
                                        throw err;
                                    }

                                    rawDossier.listMountedDossiers('/folder1', (err, content) => {
                                        if (err) {
                                            throw err;
                                        }

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
}, 5000);
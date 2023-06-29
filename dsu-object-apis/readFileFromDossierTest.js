require("../../psknode/bundles/testsRuntime");

const tir = require("../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("Read file from dossier test", (testFinishCallback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }

            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keySSISpace = openDSU.loadApi("keyssi");

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), async (err, dossier) => {
                if (err) {
                    throw err;
                }

                await dossier.safeBeginBatchAsync();
                dossier.writeFile("just_a_path", "some_content", async (err) => {
                    if (err) {
                        throw err;
                    }

                    await dossier.commitBatchAsync();
                    resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), async (err, newDossier) => {
                        if (err) {
                            throw err;
                        }

                        await newDossier.safeBeginBatchAsync();
                        newDossier.writeFile("testFile", "testContent", async (err) => {
                            assert.true(typeof err === "undefined");
                            await newDossier.commitBatchAsync();
                            newDossier.getKeySSIAsString(async (err, keySSI) => {
                                if (err) {
                                    throw err;
                                }

                                await dossier.safeBeginBatchAsync();
                                dossier.mount("/code/constitution", keySSI, async (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                    assert.true(typeof err === "undefined");

                                    await dossier.commitBatchAsync();
                                    dossier.readFile("/code/constitution/testFile", (err, data) => {
                                        if (err) {
                                            throw err;
                                        }

                                        assert.true(typeof err === "undefined");
                                        assert.true(data.toString() === "testContent");
                                        testFinishCallback();
                                    });
                                });
                            });
                        });
                    })
                });
            })
        })
    });
}, 5000);

require("../../psknode/bundles/testsRuntime");

const tir = require("../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("Delete file from mounted dossier test", (testFinishCallback) => {
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
                            newDossier.getKeySSIAsString(async (err, newDossierKeySSI) => {
                                if (err) {
                                    throw err;
                                }
                                await dossier.safeBeginBatchAsync();
                                dossier.mount("/code/constitution", newDossierKeySSI, async (err) => {
                                    if (err) {
                                        throw err;
                                    }

                                    assert.true(typeof err === "undefined");

                                    dossier.listFiles("/code/constitution", (err, files) => {
                                        if (err) {
                                            throw err;
                                        }

                                        assert.true(files.length === 2, "Unexpected files length");
                                        dossier.delete("/code/constitution/testFile", {ignoreMounts: false}, async (err) => {
                                            if (err) {
                                                throw err;
                                            }

                                            await dossier.commitBatchAsync();
                                            dossier.listFiles("/code/constitution", (err, files) => {
                                                if (err) {
                                                    throw err;
                                                }

                                                assert.true(files.length === 1, "Unexpected files length");
                                                testFinishCallback();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    })

                });
            });
        })
    });
}, 5000);

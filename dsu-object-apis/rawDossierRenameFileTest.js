require("../../psknode/bundles/testsRuntime");
require("../../psknode/bundles/pskruntime");

const tir = require("../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("Rename file in dossier", (testFinishCallback) => {
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
                dossier.writeFile("/my/file/just_a_path", "some_content", (err) => {
                    if (err) {
                        throw err;
                    }

                    dossier.rename('/my/file/just_a_path', '/folder/renamed_file', async (err) => {
                        if (err) {
                            throw err;
                        }

                        await dossier.commitBatchAsync();
                        dossier.readFile('/folder/renamed_file', async (err, data) => {
                            if (err) {
                                throw err;
                            }

                            await dossier.safeBeginBatchAsync();
                            dossier.rename('/folder', '/renamed/folder', async (err) => {
                                if (err) {
                                    throw err;
                                }

                                await dossier.commitBatchAsync();
                                dossier.readFile('/renamed/folder/renamed_file', (err, data) => {
                                    if (err) {
                                        throw err;
                                    }

                                    assert.true(data.toString() === "some_content");
                                    testFinishCallback();
                                })
                            })
                        })
                    })
                });
            })
        })
    });
}, 5000);

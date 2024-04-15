require("../../../builds/output/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;


assert.callback("Load a dossier that was a mount point to a dossier with constitution code.", (testFinishCallback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }

            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keySSISpace = openDSU.loadApi("keyssi");

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), async (err, ref) => {
                if (err) {
                    throw err;
                }

                await ref.safeBeginBatchAsync();
                ref.addFolder("../../../builds/output", "/", async (err) => {
                    if (err) {
                        throw err;
                    }

                    resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), async (err, raw_dossier) => {
                        if (err) {
                            throw err;
                        }

                        const fileContent = "$$.transactions.describe('echo', {\n" +
                            "\t\tsay: function (message) {\n" +
                            "\t\t\tthis.return(undefined, message);\n" +
                            "\t\t}\n" +
                            "\t}\n" +
                            ");";


                        ref.writeFile("domain.js", fileContent, async function (err) {
                            if (err) {
                                throw err;
                            }

                            await ref.commitBatchAsync();
                            ref.getKeySSIAsString(async (err, refKeySSI) => {
                                if (err) {
                                    throw err;
                                }

                                await raw_dossier.safeBeginBatchAsync();
                                raw_dossier.mount("/code/constitution", refKeySSI, (err) => {
                                    assert.true(typeof err === "undefined" || err === null);
                                    raw_dossier.writeFile("just_a_file", "fileContent", async function (err) {
                                        if (err) {
                                            throw err;
                                        }

                                        await raw_dossier.commitBatchAsync();
                                        raw_dossier.getKeySSIAsString((err, raw_dossierKeySSI) => {
                                            if (err) {
                                                throw err;
                                            }

                                            resolver.loadDSU(raw_dossierKeySSI, (err, handler) => {
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
                    })

                });
            })
        })
    });
}, 10000);


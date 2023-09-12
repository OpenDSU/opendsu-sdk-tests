require("../../builds/output/testsRuntime");

const tir = require("../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("rawDossier - write file into a mounted dossier", (testFinishCallback) => {
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
                ref.writeFile("text.txt", "some text for a complex test", async (err) => {
                    if (err) {
                        throw err;
                    }

                    await ref.commitBatchAsync();
                    resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), async (err, newDossier) => {
                        if (err) {
                            throw err;
                        }

                        await newDossier.safeBeginBatchAsync();
                        newDossier.writeFile("/tempFile", "", async (err) => {
                            if (err) {
                                throw err;
                            }

                            await newDossier.commitBatchAsync();
                            newDossier.getKeySSIAsString(async (err, newDossierKeySSI) => {
                                if (err) {
                                    throw err;
                                }

                                await ref.safeBeginBatchAsync();
                                ref.mount('/dossier', newDossierKeySSI, async (err) => {
                                    if (err) {
                                        throw err;
                                    }

                                    await ref.commitBatchAsync();
                                    ref.getKeySSIAsString((err, refKeySSI) => {
                                        if (err) {
                                            throw err;
                                        }
                                        resolver.loadDSU(refKeySSI, async (err, ref2) => {
                                            if (err) {
                                                throw err;
                                            }

                                            await ref2.safeBeginBatchAsync();
                                            ref2.writeFile("/dossier/file.txt", 'some text for a file inside a mounted dossier', {
                                                ignoreMounts: false,
                                                encrypt: true
                                            }, async function (err) {
                                                if (err) {
                                                    throw err;
                                                }

                                                await ref2.commitBatchAsync();
                                                newDossier.load((err) => {
                                                    if (err) {
                                                        throw err;
                                                    }

                                                    newDossier.readFile('/file.txt', (err, content) => {
                                                        if (err) {
                                                            throw err;
                                                        }

                                                        assert.true(content.toString() === 'some text for a file inside a mounted dossier');
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
            })
        })
    });
}, 10000);
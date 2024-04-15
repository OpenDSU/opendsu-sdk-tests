process.env.OPENDSU_ENABLE_DEBUG = true;
process.env.DEV = true;

require("../../../builds/output/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;
$$.LEGACY_BEHAVIOUR_ENABLED = true;

assert.callback("Create and load Const DSU test", (finishTest) => {
    double_check.createTestFolder('TEST', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require("opendsu");
            const keySSIApi = openDSU.loadApi("keyssi");
            const resolver = openDSU.loadApi("resolver");
            const sc = openDSU.loadApi("sc");

            sc.getMainEnclave((err, enclave) => {
                keySSIApi.we_createArraySSI(undefined, "default", ["one", "two", "keys"], undefined, undefined, (err, arraySSI) => {
                    if (err) {
                        throw err;
                    }
                    enclave.createDSU(arraySSI, {useSSIAsIdentifier: true, encrypt: false}, async (err, constDSU) => {
                        if (err) {
                            throw err;
                        }

                        let filename = "/onefile.txt";
                        let fileContent = "data-to-not-be-altered"
                        let batchId = await constDSU.startOrAttachBatchAsync();
                        constDSU.writeFile(filename, fileContent, async (err) => {
                            if (err) {
                                throw err;
                            }

                            await constDSU.commitBatchAsync(batchId);
                            resolver.invalidateDSUCache(arraySSI, () => {
                                //resetting brick cache
                                require('psk-cache').getDefaultInstance().resetCache();
                                resolver.loadDSU(arraySSI, (err, loadedConstDSU) => {
                                    if (err) {
                                        throw err;
                                    }

                                    loadedConstDSU.readFile(filename, (err, content) => {
                                        if (err) {
                                            throw err;
                                        }
                                        assert.true(content.toString() === fileContent);

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

}, 100000);
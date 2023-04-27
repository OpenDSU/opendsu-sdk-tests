require("../../psknode/bundles/testsRuntime");
require("../../psknode/bundles/pskruntime");

const tir = require("../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("We should be able to get a seed of a bar before finish writing?", (testFinishCallback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keySSISpace = openDSU.loadApi("keyssi");

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), async (err, bar) => {
                if (err) {
                    throw err;
                }

                await bar.safeBeginBatchAsync();
                bar.writeFile("just_a_path", "some_content", async function (err) {
                    assert.true(typeof err === "undefined");
                    await bar.commitBatchAsync();
                    testFinishCallback();
                });
            })
        })
    });
}, 5000);

require("../../../psknode/bundles/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;


async function getNextVersion(keySSI) {
    const keySSISpace = require("opendsu").loadApi("keyssi");
    const anchoringX = require("opendsu").loadApi("anchoring").getAnchoringX();
    keySSI = keySSISpace.parse(keySSI);
    let nextVersion = 0;
    let anchorId = await $$.promisify(keySSI.getAnchorId)();
    try {
        let versions = await $$.promisify(anchoringX.getAllVersions)(anchorId);
        if (versions) {
            nextVersion = versions.length;
        } else {
            //if !versions we know that is our first version
        }
    } catch (err) {
        throw err;
    }

    return nextVersion;
}

assert.callback("getAllVersionsApiTest", (finish) => {
    double_check.createTestFolder('AllVersionsTest', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keyssi = openDSU.loadApi("keyssi");
            const seedSSI = keyssi.createTemplateSeedSSI("default", undefined, undefined, "v0");

            resolver.createDSU(seedSSI, async (err, dsu) => {
                if (err) {
                    throw err;
                }

                await dsu.safeBeginBatchAsync();
                dsu.writeFile("/a.txt", "some data", async (err) => {
                    if (err) {
                        throw err;
                    }
                    await dsu.commitBatchAsync();
                    let version = await getNextVersion(dsu.getCreationSSI());
                    assert.equal(version, 2, "Version should be 2. One for write log file and one from our writefile");
                    finish();
                });
            });
        });
    });
}, 10000);
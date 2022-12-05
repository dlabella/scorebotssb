const { env } = require('process');

module.exports = {
    getConfig
};


function getConfig() {
    return {
        stage: env.STAGE || ' [BETA]',
        usersSheetId: env.USERS_SHEET_ID || '1ulI8TxEglWJqiUTaz_w58Y2_DW0f4pK_CE-nxo6ZKyo',
        standingsSheetId: env.STANDINGS_SHEET_ID || '1GPbT3eWyL3pkcqjtys5UUgKeK6U4DSiSfY1zhKLWuh4',
        adminKey: env.ADMIN_KEY||'admin',
        version:2
    }
    // return {
    //     stage: env.STAGE || "Live",
    //     usersSheetId: env.USERS_SHEET_ID || '1ulI8TxEglWJqiUTaz_w58Y2_DW0f4pK_CE-nxo6ZKyo',
    //     standingsSheetId: env.STANDINGS_SHEET_ID || '1Za8jT8su5c5usc5gZhaKOaIiGs1MGmQtITfBs4aQqd0',
    //     adminKey: env.ADMIN_KEY||'admin',
    //     version:3
    // }
}

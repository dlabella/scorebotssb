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
        version:2,
        clientCredentials: env.CLIENT_CREDENTIALS || {   "type": "service_account",   "project_id": "rankr-309319",   "private_key_id": "2428084ba3ac544cc14a3fa977deea462b6d3629",   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDW8RS0i3r2r/h7\nRzJ1wECLTBNKQfJnC9M28ySRCBy6gP3L6hj50C05u95BtfxSC4i1ITYQMz+5JK/X\nZapAkhG+XoMx5zW+jiyapCwTgAoGMFgko6XuyMN/y85cKZ7R+17IiQLA1DhXNwcf\nF3hn1ZZyeld17mdbaE7FAdaeA6FUEIJQLLiD9n3wb7OH8ofCi4ONid37hmUnSlWJ\nSTXRxo6zp1v1FFSxN2v1lyGRsYc3bFzyj2rO8o8HneJbPCsyjJs89iBW3vB745dt\nmm52q1YBattW3uiHlTR4700xvPaAX+M7JOSQsmyHNWfcp5/zeNdvLrjW5Jo46cPj\nqUt6/GEHAgMBAAECggEAFVAFpTqosFSV3JDHCxqgtm85ARr1kIwr9FM6+U/cRrig\nRxuTlb8I96Q45JEepM//TTPZgCpkvin0xEnmDiMDCWT7uJ4Gxo9NvZkGbySPWeUU\nnbAbCvNIl0pmet2m9tvoSRV00BlQQNhJp3vp9M8el4P+r3M6jRC/Br/TlQrNG2BH\n1H197GYudWHEbslEmHp9APs5RLLlClt9NeTL9fQ2HSeXonDKT49ceve4buIrFhto\nYdHCm08ixRPQZ23NyboQuq3w0LaBY1QB0wsnMG+/Qlhfwx1XhM5YzU0uvTJ/HDFH\nv31ohMxA6vSr6fVX0UDpUTxXXMw4ZRXMBi2ir6dV4QKBgQDvHvNNCTWHqjbdIN33\nCB550CLdOtmm5Lp6pwltHtFb04EWRT616gsNYV4lQesh7bLM31f8b3CI1ZilYPtq\ndLdazds1hfOKFRfRHKBk/+l5LHZueWkFZZeGFv0ZF0nQjKoXfwz7Zcj/5r2QBBAJ\n95YhSlMplRrsLIstn2czDaraEQKBgQDmHTL4FWMTrhIbTvgsSBy+6SkyKBsSYlHJ\nNOzdJEAPJK5+i5Z0Oyax7N2t2lrjf3CVokeG3FjGWrtJ2ZzgHkOQsOujIaBtid40\nlINlrUTZUnRcp5Pa0+p41TB8J4hesVCNw0UszNv9Iaw3jOeeVp9Pl/7fgv1HhKJN\nXHJis3CxlwKBgEXpXacjTyRIDtxeFKd6Fzb0NI1L/IDAFQlxNt9RiFJ5px80xZ34\nPJz/37+y4yU7UvB1SEtE5bkMAiIwFbHNSCJjV3jxnf+8JQd9gCOncsJ7znCETMFI\nL6IDrKIeXfV8eup9ufTykG7JLpkhpvLTEXDQQzpAHuv4JgUDuu+BSneRAoGAGH6D\nLmUYZr/grYd6YzxJ0wh+mhgqyYotqn03uVJifzooWNAC89xYAhh0gEz937lxAnyD\noJdT28lMpk/DoxeVmZE7g+HQcdh7Dp3AXtJSwc9FE5fC5UgpbTNENfL/URUOvghL\nFLm5sPgknMUi4nfV/WLwflozG6nCnPl6M4dmN4ECgYBApXLtBmXtG0RZgj1atbX1\nskWnVq6i8hqUvG/Z/h/+5yAd/lyWMSgvqdLKjcJMDGToPjTpZNTMzH5oP/MX+y+l\naCAUkeW07cWzMGi9S2rvzJZYafJbKk4KexmFYqqqqnMwre2qYQYSOSA8aTGPzzFf\nADg+N2r6r3uBU69RH93L+A==\n-----END PRIVATE KEY-----\n",   "client_email": "rankr-672@rankr-309319.iam.gserviceaccount.com",   "client_id": "102126284627835462259",   "auth_uri": "https://accounts.google.com/o/oauth2/auth",   "token_uri": "https://oauth2.googleapis.com/token",   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/rankr-672%40rankr-309319.iam.gserviceaccount.com" },
    }
    // return {
    //     stage: env.STAGE || "Live",
    //     usersSheetId: env.USERS_SHEET_ID || '1ulI8TxEglWJqiUTaz_w58Y2_DW0f4pK_CE-nxo6ZKyo',
    //     standingsSheetId: env.STANDINGS_SHEET_ID || '1Za8jT8su5c5usc5gZhaKOaIiGs1MGmQtITfBs4aQqd0',
    //     adminKey: env.ADMIN_KEY||'admin',
    //     version:3
    // }
}

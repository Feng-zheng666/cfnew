// 配置管理模块
// 提取自"明文源吗"文件的配置相关功能

// 默认配置值
const DEFAULT_CONFIG = {
    // 基础配置
    at: '351c9981-04b6-4103-aa4b-864aa9c91469',
    fallbackAddress: '',
    socks5Config: '',
    customPreferredIPs: [],
    customPreferredDomains: [],
    enableSocksDowngrade: false,
    disableNonTLS: false,
    disablePreferred: false,
    
    // 地区配置
    enableRegionMatching: true,
    currentWorkerRegion: '',
    manualWorkerRegion: '',
    piu: '',
    cp: '',
    
    // 协议配置
    ev: true,
    et: false,
    ex: false,
    tp: '',
    
    // ECH配置
    enableECH: false,
    customDNS: 'https://dns.joeyblog.eu.org/joeyblog',
    customECHDomain: 'cloudflare-ech.com',
    
    // 订阅配置
    scu: 'https://url.v1.mk/sub',
    remoteConfigUrl: 'https://raw.githubusercontent.com/byJoey/test/refs/heads/main/tist.ini',
    
    // 优选配置
    epd: false,
    epi: true,
    egi: true,
    
    // KV存储
    kvStore: null,
    kvConfig: {}
};

// 地区映射
const REGION_MAPPING = {
    'US': ['🇺🇸 美国', 'US', 'United States'],
    'SG': ['🇸🇬 新加坡', 'SG', 'Singapore'],
    'JP': ['🇯🇵 日本', 'JP', 'Japan'],
    'KR': ['🇰🇷 韩国', 'KR', 'South Korea'],
    'DE': ['🇩🇪 德国', 'DE', 'Germany'],
    'SE': ['🇸🇪 瑞典', 'SE', 'Sweden'],
    'NL': ['🇳🇱 荷兰', 'NL', 'Netherlands'],
    'FI': ['🇫🇮 芬兰', 'FI', 'Finland'],
    'GB': ['🇬🇧 英国', 'GB', 'United Kingdom'],
    'Oracle': ['甲骨文', 'Oracle'],
    'DigitalOcean': ['数码海', 'DigitalOcean'],
    'Vultr': ['Vultr', 'Vultr'],
    'Multacom': ['Multacom', 'Multacom']
};

// 备份IP列表
const BACKUP_IPS = [
    { domain: 'ProxyIP.US.CMLiussss.net', region: 'US', regionCode: 'US', port: 443 },
    { domain: 'ProxyIP.SG.CMLiussss.net', region: 'SG', regionCode: 'SG', port: 443 },
    { domain: 'ProxyIP.JP.CMLiussss.net', region: 'JP', regionCode: 'JP', port: 443 },
    { domain: 'ProxyIP.KR.CMLiussss.net', region: 'KR', regionCode: 'KR', port: 443 },
    { domain: 'ProxyIP.DE.CMLiussss.net', region: 'DE', regionCode: 'DE', port: 443 },
    { domain: 'ProxyIP.SE.CMLiussss.net', region: 'SE', regionCode: 'SE', port: 443 },
    { domain: 'ProxyIP.NL.CMLiussss.net', region: 'NL', regionCode: 'NL', port: 443 },
    { domain: 'ProxyIP.FI.CMLiussss.net', region: 'FI', regionCode: 'FI', port: 443 },
    { domain: 'ProxyIP.GB.CMLiussss.net', region: 'GB', regionCode: 'GB', port: 443 },
    { domain: 'ProxyIP.Oracle.cmliussss.net', region: 'Oracle', regionCode: 'Oracle', port: 443 },
    { domain: 'ProxyIP.DigitalOcean.CMLiussss.net', region: 'DigitalOcean', regionCode: 'DigitalOcean', port: 443 },
    { domain: 'ProxyIP.Vultr.CMLiussss.net', region: 'Vultr', regionCode: 'Vultr', port: 443 },
    { domain: 'ProxyIP.Multacom.CMLiussss.net', region: 'Multacom', regionCode: 'Multacom', port: 443 }
];

// 直连域名列表
const DIRECT_DOMAINS = [
    { name: "cloudflare.182682.xyz", domain: "cloudflare.182682.xyz" },
    { name: "speed.marisalnc.com", domain: "speed.marisalnc.com" },
    { domain: "freeyx.cloudflare88.eu.org" },
    { domain: "bestcf.top" },
    { domain: "cdn.2020111.xyz" },
    { domain: "cfip.cfcdn.vip" },
    { domain: "cf.0sm.com" },
    { domain: "cf.090227.xyz" },
    { domain: "cf.zhetengsha.eu.org" },
    { domain: "cloudflare.9jy.cc" },
    { domain: "cf.zerone-cdn.pp.ua" },
    { domain: "cfip.1323123.xyz" },
    { domain: "cnamefuckxxs.yuchen.icu" },
    { domain: "cloudflare-ip.mofashi.ltd" },
    { domain: "115155.xyz" },
    { domain: "cname.xirancdn.us" },
    { domain: "f3058171cad.002404.xyz" },
    { domain: "8.889288.xyz" },
    { domain: "cdn.tzpro.xyz" },
    { domain: "cf.877771.xyz" },
    { domain: "xn--b6gac.eu.org" }
];

// 错误常量
const ERROR_CONSTANTS = {
    E_INVALID_DATA: atob('aW52YWxpZCBkYXRh'),
    E_INVALID_USER: atob('aW52YWxpZCB1c2Vy'),
    E_UNSUPPORTED_CMD: atob('Y29tbWFuZCBpcyBub3Qgc3VwcG9ydGVk'),
    E_UDP_DNS_ONLY: atob('VURQIHByb3h5IG9ubHkgZW5hYmxlIGZvciBETlMgd2hpY2ggaXMgcG9ydCA1Mw=='),
    E_INVALID_ADDR_TYPE: atob('aW52YWxpZCBhZGRyZXNzVHlwZQ=='),
    E_EMPTY_ADDR: atob('YWRkcmVzc1ZhbHVlIGlzIGVtcHR5'),
    E_WS_NOT_OPEN: atob('d2ViU29ja2V0LmVhZHlTdGF0ZSBpcyBub3Qgb3Blbg=='),
    E_INVALID_ID_STR: atob('U3RyaW5naWZpZWQgaWRlbnRpZmllciBpcyBpbnZhbGlk'),
    E_INVALID_SOCKS_ADDR: atob('SW52YWxpZCBTT0NLUyBhZGRyZXNzIGZvcm1hdA=='),
    E_SOCKS_NO_METHOD: atob('bm8gYWNjZXB0YWJsZSBtZXRob2Rz'),
    E_SOCKS_AUTH_NEEDED: atob('c29ja3Mgc2VydmVyIG5lZWRzIGF1dGg='),
    E_SOCKS_AUTH_FAIL: atob('ZmFpbCB0byBhdXRoIHNvY2tzIHNlcnZlcg=='),
    E_SOCKS_CONN_FAIL: atob('ZmFpbCB0byBvcGVuIHNvY2tzIGNvbm5lY3Rpb24=')
};

// 地址类型常量
const ADDRESS_TYPE = {
    IPV4: 1,
    URL: 2,
    IPV6: 3
};

// 导出的函数
export async function initKVStore(env) {
    if (env.C) {
        try {
            const kvStore = env.C;
            return kvStore;
        } catch (error) {
            console.error('初始化KV存储失败:', error);
            return null;
        }
    }
    return null;
}

export async function loadKVConfig(kvStore) {
    if (!kvStore) {
        return {};
    }
    
    try {
        const configData = await kvStore.get('c');
        if (configData) {
            return JSON.parse(configData);
        } else {
            return {};
        }
    } catch (error) {
        console.error('加载KV配置失败:', error);
        return {};
    }
}

export async function saveKVConfig(kvStore, config) {
    if (!kvStore) {
        return;
    }
    
    try {
        const configString = JSON.stringify(config);
        await kvStore.put('c', configString);
    } catch (error) {
        console.error('保存KV配置失败:', error);
        throw error;
    }
}

export function getConfigValue(config, key, defaultValue = '') {
    if (config[key] !== undefined) {
        return config[key];
    }
    return defaultValue;
}

export async function setConfigValue(kvStore, config, key, value) {
    config[key] = value;
    if (kvStore) {
        await saveKVConfig(kvStore, config);
    }
}

// 导出常量
export {
    DEFAULT_CONFIG,
    REGION_MAPPING,
    BACKUP_IPS,
    DIRECT_DOMAINS,
    ERROR_CONSTANTS,
    ADDRESS_TYPE
};

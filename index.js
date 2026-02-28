// CFnew - 终端 v2.9.3
// 版本: v2.9.3
import { connect } from 'cloudflare:sockets';
import { 
    isValidFormat, 
    isValidIP, 
    parseAddressAndPort, 
    isValidDomain,
    arrayToYx,
    parseYxToArray,
    formatIdentifier,
    base64ToArray,
    closeSocketQuietly,
    parseSocksConfig,
    sha224Hash,
    rightRotate,
    ipToHex,
    getColoName,
    parseTextToArray,
    fetchPreferredAPI
} from './utils/validation.js';
import { 
    initKVStore, 
    loadKVConfig, 
    saveKVConfig, 
    getConfigValue, 
    setConfigValue 
} from './config/config.js';

let at = '351c9981-04b6-4103-aa4b-864aa9c91469';
let fallbackAddress = '';
let socks5Config = '';
let customPreferredIPs = [];
let customPreferredDomains = [];
let enableSocksDowngrade = false;
let disableNonTLS = false;
let disablePreferred = false;

let enableRegionMatching = true;
let currentWorkerRegion = '';
let manualWorkerRegion = '';
let piu = '';
let cp = '';  

let ev = true;   
let et = false; 
let ex = false;  
let tp = '';
// 启用ECH功能（true启用，false禁用）
let enableECH = false;  
// 自定义DNS服务器（默认：https://dns.joeyblog.eu.org/joeyblog）
let customDNS = 'https://dns.joeyblog.eu.org/joeyblog';
// 自定义ECH域名（默认：cloudflare-ech.com）
let customECHDomain = 'cloudflare-ech.com';

let scu = 'https://url.v1.mk/sub';  
// 远程配置URL（硬编码）
const remoteConfigUrl = 'https://raw.githubusercontent.com/byJoey/test/refs/heads/main/tist.ini';

let epd = false;   // 优选域名默认关闭
let epi = true;       
let egi = true;          

let kvStore = null;
let kvConfig = {};

const regionMapping = {
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

let backupIPs = [
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

const directDomains = [
    { name: "cloudflare.182682.xyz", domain: "cloudflare.182682.xyz" }, { name: "speed.marisalnc.com", domain: "speed.marisalnc.com" },
    { domain: "freeyx.cloudflare88.eu.org" }, { domain: "bestcf.top" }, { domain: "cdn.2020111.xyz" }, { domain: "cfip.cfcdn.vip" },
    { domain: "cf.0sm.com" }, { domain: "cf.090227.xyz" }, { domain: "cf.zhetengsha.eu.org" }, { domain: "cloudflare.9jy.cc" },
    { domain: "cf.zerone-cdn.pp.ua" }, { domain: "cfip.1323123.xyz" }, { domain: "cnamefuckxxs.yuchen.icu" }, { domain: "cloudflare-ip.mofashi.ltd" },
    { domain: "115155.xyz" }, { domain: "cname.xirancdn.us" }, { domain: "f3058171cad.002404.xyz" }, { domain: "8.889288.xyz" },
    { domain: "cdn.tzpro.xyz" }, { domain: "cf.877771.xyz" }, { domain: "xn--b6gac.eu.org" }
];

const E_INVALID_DATA = atob('aW52YWxpZCBkYXRh');
const E_INVALID_USER = atob('aW52YWxpZCB1c2Vy');
const E_UNSUPPORTED_CMD = atob('Y29tbWFuZCBpcyBub3Qgc3VwcG9ydGVk');
const E_UDP_DNS_ONLY = atob('VURQIHByb3h5IG9ubHkgZW5hYmxlIGZvciBETlMgd2hpY2ggaXMgcG9ydCA1Mw==');
const E_INVALID_ADDR_TYPE = atob('aW52YWxpZCBhZGRyZXNzVHlwZQ==');
const E_EMPTY_ADDR = atob('YWRkcmVzc1ZhbHVlIGlzIGVtcHR5');
const E_WS_NOT_OPEN = atob('d2ViU29ja2V0LmVhZHlTdGF0ZSBpcyBub3Qgb3Blbg==');
const E_INVALID_ID_STR = atob('U3RyaW5naWZpZWQgaWRlbnRpZmllciBpcyBpbnZhbGlk');
const E_INVALID_SOCKS_ADDR = atob('SW52YWxpZCBTT0NLUyBhZGRyZXNzIGZvcm1hdA==');
const E_SOCKS_NO_METHOD = atob('bm8gYWNjZXB0YWJsZSBtZXRob2Rz');
const E_SOCKS_AUTH_NEEDED = atob('c29ja3Mgc2VydmVyIG5lZWRzIGF1dGg=');
const E_SOCKS_AUTH_FAIL = atob('ZmFpbCB0byBhdXRoIHNvY2tzIHNlcnZlcg==');
const E_SOCKS_CONN_FAIL = atob('ZmFpbCB0byBvcGVuIHNvY2tzIGNvbm5lY3Rpb24=');

let parsedSocks5Config = {};
let isSocksEnabled = false;

const ADDRESS_TYPE_IPV4 = 1;
const ADDRESS_TYPE_URL = 2;
const ADDRESS_TYPE_IPV6 = 3;

async function detectWorkerRegion(request) {
    try {
        const cfCountry = request.cf?.country;
        
        if (cfCountry) {
            const countryToRegion = {
                'US': 'US', 'SG': 'SG', 'JP': 'JP', 'KR': 'KR',
                'DE': 'DE', 'SE': 'SE', 'NL': 'NL', 'FI': 'FI', 'GB': 'GB',
                'CN': 'SG', 'TW': 'JP', 'AU': 'SG', 'CA': 'US',
                'FR': 'DE', 'IT': 'DE', 'ES': 'DE', 'CH': 'DE',
                'AT': 'DE', 'BE': 'NL', 'DK': 'SE', 'NO': 'SE', 'IE': 'GB'
            };
            
            if (countryToRegion[cfCountry]) {
                return countryToRegion[cfCountry];
            }
        }
        
        return 'SG';
        
    } catch (error) {
        return 'SG';
    }
}

async function checkIPAvailability(domain, port = 443, timeout = 2000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(`https://${domain}`, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CF-IP-Checker/1.0)'
            }
        });
        
        clearTimeout(timeoutId);
        return response.status < 500;
    } catch (error) {
        return true;
    }
}

async function getBestBackupIP(workerRegion = '') {
    
    if (backupIPs.length === 0) {
        return null;
    }
    
    const availableIPs = backupIPs.map(ip => ({ ...ip, available: true }));
    
    if (enableRegionMatching && workerRegion) {
        const sortedIPs = getSmartRegionSelection(workerRegion, availableIPs);
        if (sortedIPs.length > 0) {
            const selectedIP = sortedIPs[0];
            return selectedIP;
        }
    }
    
    const selectedIP = availableIPs[0];
    return selectedIP;
}

function getNearbyRegions(region) {
    const nearbyMap = {
        'US': ['SG', 'JP', 'KR'], 
        'SG': ['JP', 'KR', 'US'], 
        'JP': ['SG', 'KR', 'US'], 
        'KR': ['JP', 'SG', 'US'], 
        'DE': ['NL', 'GB', 'SE', 'FI'], 
        'SE': ['DE', 'NL', 'FI', 'GB'], 
        'NL': ['DE', 'GB', 'SE', 'FI'], 
        'FI': ['SE', 'DE', 'NL', 'GB'], 
        'GB': ['DE', 'NL', 'SE', 'FI']  
    };
    
    return nearbyMap[region] || [];
}

function getAllRegionsByPriority(region) {
    const nearbyRegions = getNearbyRegions(region);
    const allRegions = ['US', 'SG', 'JP', 'KR', 'DE', 'SE', 'NL', 'FI', 'GB'];
    
    return [region, ...nearbyRegions, ...allRegions.filter(r => r !== region && !nearbyRegions.includes(r))];
}

function getSmartRegionSelection(workerRegion, availableIPs) {
    
    if (!enableRegionMatching || !workerRegion) {
        return availableIPs;
    }
    
    const priorityRegions = getAllRegionsByPriority(workerRegion);
    
    const sortedIPs = [];
    
    for (const region of priorityRegions) {
        const regionIPs = availableIPs.filter(ip => ip.regionCode === region);
        sortedIPs.push(...regionIPs);
    }
    
    return sortedIPs;
}

export default {
    async fetch(request, env, ctx) {
        try {
            
            await initKVStore(env);
            
            at = (env.u || env.U || at).toLowerCase();
            const subPath = (env.d || env.D || at).toLowerCase();
            
            const ci = getConfigValue('p', env.p || env.P);
            let useCustomIP = false;
            
            const manualRegion = getConfigValue('wk', env.wk || env.WK);
            if (manualRegion && manualRegion.trim()) {
                manualWorkerRegion = manualRegion.trim().toUpperCase();
                currentWorkerRegion = manualWorkerRegion;
        } else if (ci && ci.trim()) {
                useCustomIP = true;
                currentWorkerRegion = 'CUSTOM';
            } else {
                currentWorkerRegion = await detectWorkerRegion(request);
            }
            
            const regionMatchingControl = env.rm || env.RM;
            if (regionMatchingControl && regionMatchingControl.toLowerCase() === 'no') {
                enableRegionMatching = false;
            }
            
            const envFallback = getConfigValue('p', env.p || env.P);
            if (envFallback) {
                fallbackAddress = envFallback.trim();
            }

            socks5Config = getConfigValue('s', env.s || env.S) || socks5Config;
            if (socks5Config) {
                try {
                    parsedSocks5Config = parseSocksConfig(socks5Config);
                    isSocksEnabled = true;
                } catch (err) {
                    isSocksEnabled = false;
                }
            }

            const customPreferred = getConfigValue('yx', env.yx || env.YX);
            if (customPreferred) {
                try {
                    const preferredList = customPreferred.split(',').map(item => item.trim()).filter(item => item);
                    customPreferredIPs = [];
                    customPreferredDomains = [];
                    
                    preferredList.forEach(item => {
                        
                        let nodeName = '';
                        let addressPart = item;
                        
                        if (item.includes('#')) {
                            const parts = item.split('#');
                            addressPart = parts[0].trim();
                            nodeName = parts[1].trim();
                        }
                        
                        const { address, port } = parseAddressAndPort(addressPart);
                        
                        if (!nodeName) {
                            nodeName = '自定义优选-' + address + (port ? ':' + port : '');
                        }
                        
                        if (isValidIP(address)) {
                            customPreferredIPs.push({ 
                                ip: address, 
                                port: port,
                                isp: nodeName
                            });
                        } else {
                            customPreferredDomains.push({ 
                                domain: address, 
                                port: port,
                                name: nodeName
                            });
                        }
                    });
                } catch (err) {
                    customPreferredIPs = [];
                    customPreferredDomains = [];
                }
            }

            const downgradeControl = getConfigValue('qj', env.qj || env.QJ);
            if (downgradeControl && downgradeControl.toLowerCase() === 'no') {
                enableSocksDowngrade = true;
            }

            const dkbyControl = getConfigValue('dkby', env.dkby || env.DKBY);
            if (dkbyControl && dkbyControl.toLowerCase() === 'yes') {
                disableNonTLS = true;
            }

            const yxbyControl = env.yxby || env.YXBY;
            if (yxbyControl && yxbyControl.toLowerCase() === 'yes') {
                disablePreferred = true;
            }

            const vlessControl = getConfigValue('ev', env.ev);
            if (vlessControl !== undefined && vlessControl !== '') {
                ev = vlessControl === 'yes' || vlessControl === true || vlessControl === 'true';
            }
            
        const tjControl = getConfigValue('et', env.et);
        if (tjControl !== undefined && tjControl !== '') {
            et = tjControl === 'yes' || tjControl === true || tjControl === 'true';
        }
            
            tp = getConfigValue('tp', env.tp) || '';
            
            const xhttpControl = getConfigValue('ex', env.ex);
            if (xhttpControl !== undefined && xhttpControl !== '') {
                ex = xhttpControl === 'yes' || xhttpControl === true || xhttpControl === 'true';
            }
            
            scu = getConfigValue('scu', env.scu) || 'https://url.v1.mk/sub';
            
            const preferredDomainsControl = getConfigValue('epd', env.epd || 'no');
            if (preferredDomainsControl !== undefined && preferredDomainsControl !== '') {
                epd = preferredDomainsControl !== 'no' && preferredDomainsControl !== false && preferredDomainsControl !== 'false';
            }
            
            const preferredIPsControl = getConfigValue('epi', env.epi);
            if (preferredIPsControl !== undefined && preferredIPsControl !== '') {
                epi = preferredIPsControl !== 'no' && preferredIPsControl !== false && preferredIPsControl !== 'false';
            }
            
            const githubIPsControl = getConfigValue('egi', env.egi);
            if (githubIPsControl !== undefined && githubIPsControl !== '') {
                egi = githubIPsControl !== 'no' && githubIPsControl !== false && githubIPsControl !== 'false';
            }
            
            const echControl = getConfigValue('ech', env.ech);
            if (echControl !== undefined && echControl !== '') {
                enableECH = echControl === 'yes' || echControl === true || echControl === 'true';
            }
            
            // 加载自定义DNS和ECH域名配置
            const customDNSValue = getConfigValue('customDNS', '');
            if (customDNSValue && customDNSValue.trim()) {
                customDNS = customDNSValue.trim();
            }
            
            const customECHDomainValue = getConfigValue('customECHDomain', '');
            if (customECHDomainValue && customECHDomainValue.trim()) {
                customECHDomain = customECHDomainValue.trim();
            }
            
            // 如果启用了ECH，自动启用仅TLS模式（避免80端口干扰）
            // ECH需要TLS才能工作，所以必须禁用非TLS节点
            if (enableECH) {
                disableNonTLS = true;
                // 检查 KV 中是否有 dkby: yes，没有就直接写入
                const currentDkby = getConfigValue('dkby', '');
                if (currentDkby !== 'yes') {
                    await setConfigValue('dkby', 'yes');
                }
            }
            
            if (!ev && !et && !ex) {
                ev = true;
            }

        piu = getConfigValue('yxURL', env.yxURL || env.YXURL) || 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt';
        
        cp = getConfigValue('d', env.d || env.D) || '';
        
            const defaultURL = 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt';
        if (piu !== defaultURL) {
                directDomains.length = 0;
                customPreferredIPs = [];
                customPreferredDomains = [];
            }

            const url = new URL(request.url);

            if (url.pathname.includes('/api/config')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                
                const apiIndex = pathParts.indexOf('api');
                if (apiIndex > 0) {
                    const pathSegments = pathParts.slice(0, apiIndex);
                    const pathIdentifier = pathSegments.join('/');
                    
                let isValid = false;
                if (cp && cp.trim()) {
                    
                    const cleanCustomPath = cp.trim().startsWith('/') ? cp.trim().substring(1) : cp.trim();
                    isValid = (pathIdentifier === cleanCustomPath);
                    } else {
                        
                        isValid = (isValidFormat(pathIdentifier) && pathIdentifier === at);
                    }
                    
                    if (isValid) {
                        return await handleConfigAPI(request);
                    } else {
                        return new Response(JSON.stringify({ error: '路径验证失败' }), { 
                            status: 403,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
                
                return new Response(JSON.stringify({ error: '无效的API路径' }), { 
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            if (url.pathname.includes('/api/preferred-ips')) {
                const pathParts = url.pathname.split('/').filter(p => p);
            
                const apiIndex = pathParts.indexOf('api');
                if (apiIndex > 0) {
                const pathSegments = pathParts.slice(0, apiIndex);
                const pathIdentifier = pathSegments.join('/');
                
                let isValid = false;
                if (cp && cp.trim()) {
                    
                    const cleanCustomPath = cp.trim().startsWith('/') ? cp.trim().substring(1) : cp.trim();
                    isValid = (pathIdentifier === cleanCustomPath);
                } else {
                    
                    isValid = (isValidFormat(pathIdentifier) && pathIdentifier === at);
                }
                
                if (isValid) {
                        return await handlePreferredIPsAPI(request);
                } else {
                    return new Response(JSON.stringify({ error: '路径验证失败' }), { 
                            status: 403,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            
                return new Response(JSON.stringify({ error: '无效的API路径' }), { 
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        
        if (request.method === 'POST' && ex) {
            const r = await handleXhttpPost(request);
            if (r) {
                ctx.waitUntil(r.closed);
                return new Response(r.readable, {
                    headers: {
                        'X-Accel-Buffering': 'no',
                        'Cache-Control': 'no-store',
                        Connection: 'keep-alive',
                        'User-Agent': 'Go-http-client/2.0',
                        'Content-Type': 'application/grpc',
                    },
                });
            }
            return new Response('Internal Server Error', { status: 500 });
        }

        if (request.headers.get('Upgrade') === atob('d2Vic29ja2V0')) {
            return await handleWsRequest(request);
            }
            
            if (request.method === 'GET') {
                // 处理 /{UUID}/region 或 /{自定义路径}/region
                if (url.pathname.endsWith('/region')) {
                    const pathParts = url.pathname.split('/').filter(p => p);
                    
                    if (pathParts.length === 2 && pathParts[1] === 'region') {
                        const pathIdentifier = pathParts[0];
                        let isValid = false;
                        
                        if (cp && cp.trim()) {
                            // 使用自定义路径
                            const cleanCustomPath = cp.trim().startsWith('/') ? cp.trim().substring(1) : cp.trim();
                            isValid = (pathIdentifier === cleanCustomPath);
                        } else {
                            // 使用UUID路径
                            isValid = (isValidFormat(pathIdentifier) && pathIdentifier === at);
                        }
                        
                        if (isValid) {
                            const ci = getConfigValue('p', env.p || env.P);
                            const manualRegion = getConfigValue('wk', env.wk || env.WK);
                            
                            if (manualRegion && manualRegion.trim()) {
                                return new Response(JSON.stringify({
                                    region: manualRegion.trim().toUpperCase(),
                                    detectionMethod: '手动指定地区',
                                    manualRegion: manualRegion.trim().toUpperCase(),
                                    timestamp: new Date().toISOString()
                                }), {
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            } else if (ci && ci.trim()) {
                                return new Response(JSON.stringify({
                                    region: 'CUSTOM',
                                    detectionMethod: '自定义ProxyIP模式', ci: ci,
                                    timestamp: new Date().toISOString()
                                }), {
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            } else {
                                const detectedRegion = await detectWorkerRegion(request);
                                return new Response(JSON.stringify({
                                    region: detectedRegion,
                                    detectionMethod: 'API检测',
                                    timestamp: new Date().toISOString()
                                }), {
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            }
                        } else {
                            return new Response(JSON.stringify({ 
                                error: '访问被拒绝',
                                message: '路径验证失败'
                            }), { 
                                status: 403,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    }
                }
                
                // 处理 /{UUID}/test-api 或 /{自定义路径}/test-api
                if (url.pathname.endsWith('/test-api')) {
                    const pathParts = url.pathname.split('/').filter(p => p);
                    
                    if (pathParts.length === 2 && pathParts[1] === 'test-api') {
                        const pathIdentifier = pathParts[0];
                        let isValid = false;
                        
                        if (cp && cp.trim()) {
                            // 使用自定义路径
                            const cleanCustomPath = cp.trim().startsWith('/') ? cp.trim().substring(1) : cp.trim();
                            isValid = (pathIdentifier === cleanCustomPath);
                        } else {
                            // 使用UUID路径
                            isValid = (isValidFormat(pathIdentifier) && pathIdentifier === at);
                        }
                        
                        if (isValid) {
                            try {
                                const testRegion = await detectWorkerRegion(request);
                                return new Response(JSON.stringify({
                                    detectedRegion: testRegion,
                                    message: 'API测试完成',
                                    timestamp: new Date().toISOString()
                                }), {
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            } catch (error) {
                                return new Response(JSON.stringify({
                                    error: error.message,
                                    message: 'API测试失败'
                                }), {
                                    status: 500,
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            }
                        } else {
                            return new Response(JSON.stringify({ 
                                error: '访问被拒绝',
                                message: '路径验证失败'
                            }), { 
                                status: 403,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    }
                }
                
                if (url.pathname === '/') {
                    // 检查是否有自定义首页URL配置
                    const customHomepage = getConfigValue('homepage', env.homepage || env.HOMEPAGE);
                    if (customHomepage && customHomepage.trim()) {
                        try {
                            // 从自定义URL获取内容
                            const homepageResponse = await fetch(customHomepage.trim(), {
                                method: 'GET',
                                headers: {
                                    'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
                                    'Accept': request.headers.get('Accept') || '*/*',
                                    'Accept-Language': request.headers.get('Accept-Language') || 'en-US,en;q=0.9',
                                },
                                redirect: 'follow'
                            });
                            
                            if (homepageResponse.ok) {
                                // 获取响应内容
                                const contentType = homepageResponse.headers.get('Content-Type') || 'text/html; charset=utf-8';
                                const content = await homepageResponse.text();
                                
                                // 返回自定义首页内容
                                return new Response(content, {
                                    status: homepageResponse.status,
                                    headers: {
                                        'Content-Type': contentType,
                                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                                    }
                                });
                            }
                        } catch (error) {
                            // 如果获取失败，继续使用默认终端页面
                            console.error('获取自定义首页失败:', error);
                        }
                    }
                    // 优先检查Cookie中的语言设置
                    const cookieHeader = request.headers.get('Cookie') || '';
                    let langFromCookie = null;
                    if (cookieHeader) {
                        const cookies = cookieHeader.split(';').map(c => c.trim());
                        for (const cookie of cookies) {
                            if (cookie.startsWith('preferredLanguage=')) {
                                langFromCookie = cookie.split('=')[1];
                                break;
                            }
                        }
                    }
                    
                    let isFarsi = false;
                    
                    if (langFromCookie === 'fa' || langFromCookie === 'fa-IR') {
                        isFarsi = true;
                    } else if (langFromCookie === 'zh' || langFromCookie === 'zh-CN') {
                        isFarsi = false;
                    } else {
                        // 如果没有Cookie，使用浏览器语言检测
                        const acceptLanguage = request.headers.get('Accept-Language') || '';
                        const browserLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
                        isFarsi = browserLang === 'fa' || acceptLanguage.includes('fa-IR') || acceptLanguage.includes('fa');
                    }
                        
                        const lang = isFarsi ? 'fa' : 'zh-CN';
                        const langAttr = isFarsi ? 'fa-IR' : 'zh-CN';
                        
                        const translations = {
                            zh: {
                                title: '终端',
                                terminal: '终端',
                                congratulations: '恭喜你来到这',
                                enterU: '请输入你U变量的值',
                                enterD: '请输入你D变量的值',
                                command: '命令: connect [',
                                uuid: 'UUID',
                                path: 'PATH',
                                inputU: '输入U变量的内容并且回车...',
                                inputD: '输入D变量的内容并且回车...',
                                connecting: '正在连接...',
                                invading: '正在入侵...',
                                success: '连接成功！返回结果...',
                                error: '错误: 无效的UUID格式',
                                reenter: '请重新输入有效的UUID'
                            },
                            fa: {
                                title: 'ترمینال',
                                terminal: 'ترمینال',
                                congratulations: 'تبریک می‌گوییم به شما',
                                enterU: 'لطفا مقدار متغیر U خود را وارد کنید',
                                enterD: 'لطفا مقدار متغیر D خود را وارد کنید',
                                command: 'دستور: connect [',
                                uuid: 'UUID',
                                path: 'PATH',
                                inputU: 'محتویات متغیر U را وارد کرده و Enter را بزنید...',
                                inputD: 'محتویات متغیر D را وارد کرده و Enter را بزنید...',
                                connecting: 'در حال اتصال...',
                                invading: 'در حال نفوذ...',
                                success: 'اتصال موفق! در حال بازگشت نتیجه...',
                                error: 'خطا: فرمت UUID نامعتبر',
                                reenter: 'لطفا UUID معتبر را دوباره وارد کنید'
                            }
                        };
                        
                        const t = translations[isFarsi ? 'fa' : 'zh'];
                        
                    const terminalHtml = `<!DOCTYPE html>
        <html lang="${langAttr}" dir="${isFarsi ? 'rtl' : 'ltr'}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${t.title}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: "Courier New", monospace;
                background: #000; color: #00ff00; min-height: 100vh;
                overflow-x: hidden; position: relative;
                display: flex; justify-content: center; align-items: center;
            }
            .matrix-bg {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: #000;
                z-index: -1;
            }
            @keyframes bg-pulse {
                0%, 100% { background: linear-gradient(45deg, #000 0%, #001100 50%, #000 100%); }
                50% { background: linear-gradient(45deg, #000 0%, #002200 50%, #000 100%); }
            }
            .matrix-rain {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: transparent;
                z-index: -1;
                display: none;
            }
            @keyframes matrix-fall {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100vh); }
            }
            .matrix-code-rain {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; z-index: -1;
                overflow: hidden;
                display: none;
            }
            .matrix-column {
                position: absolute; top: -100%; left: 0;
                color: #00ff00; font-family: "Courier New", monospace;
                font-size: 14px; line-height: 1.2;
                text-shadow: 0 0 5px #00ff00;
            }
            @keyframes matrix-drop {
                0% { top: -100%; opacity: 1; }
                10% { opacity: 1; }
                90% { opacity: 0.3; }
                100% { top: 100vh; opacity: 0; }
            }
            .matrix-column:nth-child(odd) {
                animation-duration: 12s;
                animation-delay: -2s;
            }
            .matrix-column:nth-child(even) {
                animation-duration: 18s;
                animation-delay: -5s;
            }
            .matrix-column:nth-child(3n) {
                animation-duration: 20s;
                animation-delay: -8s;
            }
            .terminal {
                width: 90%; max-width: 800px; height: 500px;
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #00ff00;
                border-radius: 8px;
                box-shadow: 0 0 30px rgba(0, 255, 0, 0.5), inset 0 0 20px rgba(0, 255, 0, 0.1);
                backdrop-filter: blur(10px);
                position: relative; z-index: 1;
                overflow: hidden;
            }
            .terminal-header {
                background: rgba(0, 20, 0, 0.8);
                padding: 10px 15px;
                border-bottom: 1px solid #00ff00;
                display: flex; align-items: center;
            }
            .terminal-buttons {
                display: flex; gap: 8px;
            }
            .terminal-button {
                width: 12px; height: 12px; border-radius: 50%;
                background: #ff5f56;
            }
            .terminal-button:nth-child(2) {
                background: #ffbd2e;
            }
            .terminal-button:nth-child(3) {
                background: #27c93f;
            }
            .terminal-title {
                margin-left: 15px;
                color: #00ff00;
                font-weight: bold;
                font-size: 14px;
            }
            .terminal-body {
                padding: 20px;
                height: calc(100% - 50px);
                overflow-y: auto;
                font-size: 14px;
                line-height: 1.5;
            }
            .terminal-line {
                margin-bottom: 10px;
                display: flex;
                align-items: center;
            }
            .terminal-prompt {
                color: #00ff00;
                margin-right: 10px;
                white-space: nowrap;
            }
            .terminal-input {
                background: transparent;
                border: none;
                color: #00ff00;
                font-family: "Courier New", monospace;
                font-size: 14px;
                outline: none;
                flex: 1;
                caret-color: #00ff00;
            }
            .terminal-input::placeholder {
                color: #00aa00;
            }
            .terminal-output {
                color: #00ff00;
                margin-top: 10px;
                white-space: pre-wrap;
                word-break: break-all;
            }
            .terminal-error {
                color: #ff5555;
            }
            .terminal-success {
                color: #55ff55;
            }
            .terminal-info {
                color: #5555ff;
            }
            .language-switcher {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 2;
            }
            .language-button {
                background: rgba(0, 20, 0, 0.8);
                color: #00ff00;
                border: 1px solid #00ff00;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-family: "Courier New", monospace;
                font-size: 12px;
            }
            .language-button:hover {
                background: rgba(0, 40, 0, 0.8);
            }
            @media (max-width: 768px) {
                .terminal {
                    width: 95%;
                    height: 400px;
                }
                .terminal-body {
                    padding: 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="matrix-bg"></div>
        <div class="matrix-rain"></div>
        <div class="matrix-code-rain"></div>
        
        <div class="language-switcher">
            <button class="language-button" onclick="switchLanguage('zh-CN')">中文</button>
            <button class="language-button" onclick="switchLanguage('fa-IR')">فارسی</button>
        </div>
        
        <div class="terminal">
            <div class="terminal-header">
                <div class="terminal-buttons">
                    <div class="terminal-button"></div>
                    <div class="terminal-button"></div>
                    <div class="terminal-button"></div>
                </div>
                <div class="terminal-title">${t.terminal}</div>
            </div>
            <div class="terminal-body">
                <div class="terminal-line">
                    <span class="terminal-prompt">$</span>
                    <span class="terminal-output">${t.congratulations}</span>
                </div>
                <div class="terminal-line">
                    <span class="terminal-prompt">$</span>
                    <span class="terminal-output">${t.enterU}</span>
                </div>
                <div class="terminal-line">
                    <span class="terminal-prompt">$</span>
                    <input type="text" class="terminal-input" id="uuidInput" placeholder="${t.inputU}" autocomplete="off">
                </div>
                <div class="terminal-line">
                    <span class="terminal-prompt">$</span>
                    <span class="terminal-output">${t.enterD}</span>
                </div>
                <div class="terminal-line">
                    <span class="terminal-prompt">$</span>
                    <input type="text" class="terminal-input" id="pathInput" placeholder="${t.inputD}" autocomplete="off">
                </div>
                <div class="terminal-line">
                    <span class="terminal-prompt">$</span>
                    <span class="terminal-output">${t.command} <span id="uuidDisplay">${t.uuid}</span>]</span>
                </div>
                <div class="terminal-line">
                    <span class="terminal-prompt">$</span>
                    <button class="terminal-input" style="background: #003300; border: 1px solid #00ff00; color: #00ff00; padding: 5px 15px; cursor: pointer;" onclick="connect()">connect</button>
                </div>
                <div class="terminal-line" id="statusLine" style="display: none;">
                    <span class="terminal-prompt">$</span>
                    <span class="terminal-output" id="statusText"></span>
                </div>
                <div class="terminal-line" id="resultLine" style="display: none;">
                    <span class="terminal-prompt">$</span>
                    <span class="terminal-output" id="resultText"></span>
                </div>
            </div>
        </div>
        
        <script>
            let currentLang = '${lang}';
            
            function switchLanguage(langCode) {
                document.cookie = 'preferredLanguage=' + langCode + '; path=/; max-age=31536000';
                location.reload();
            }
            
            function connect() {
                const uuidInput = document.getElementById('uuidInput').value.trim();
                const pathInput = document.getElementById('pathInput').value.trim();
                
                if (!uuidInput) {
                    showError('${t.error}');
                    return;
                }
                
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(uuidInput)) {
                    showError('${t.error}');
                    return;
                }
                
                document.getElementById('statusLine').style.display = 'flex';
                document.getElementById('statusText').textContent = '${t.connecting}';
                document.getElementById('statusText').className = 'terminal-output terminal-info';
                
                setTimeout(() => {
                    document.getElementById('statusText').textContent = '${t.invading}';
                    
                    setTimeout(() => {
                        document.getElementById('statusText').textContent = '${t.success}';
                        document.getElementById('statusText').className = 'terminal-output terminal-success';
                        
                        document.getElementById('resultLine').style.display = 'flex';
                        document.getElementById('resultText').textContent = 'UUID: ' + uuidInput + '\\nPATH: ' + (pathInput || '/');
                        document.getElementById('resultText').className = 'terminal-output terminal-success';
                    }, 1000);
                }, 1000);
            }
            
            function showError(message) {
                document.getElementById('statusLine').style.display = 'flex';
                document.getElementById('statusText').textContent = message;
                document.getElementById('statusText').className = 'terminal-output terminal-error';
                
                setTimeout(() => {
                    document.getElementById('statusText').textContent = '${t.reenter}';
                }, 2000);
            }
            
            document.getElementById('uuidInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    connect();
                }
            });
            
            document.getElementById('pathInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    connect();
                }
            });
            
            document.getElementById('uuidInput').focus();
        </script>
    </body>
</html>`;
                    
                    return new Response(terminalHtml, {
                        headers: {
                            'Content-Type': 'text/html; charset=utf-8',
                            'Cache-Control': 'no-cache, no-store, must-revalidate'
                        }
                    });
                }
                
                return new Response('Not Found', { status: 404 });
            }
            
            return new Response('Method Not Allowed', { status: 405 });
        } catch (error) {
            console.error('Error in fetch handler:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }
};

async function handleConfigAPI(request) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        
        if (action === 'get') {
            const allConfig = await loadKVConfig();
            return new Response(JSON.stringify(allConfig), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else if (action === 'set') {
            const key = url.searchParams.get('key');
            const value = url.searchParams.get('value');
            
            if (!key || value === null) {
                return new Response(JSON.stringify({ error: '缺少参数' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            await setConfigValue(key, value);
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else if (action === 'delete') {
            const key = url.searchParams.get('key');
            
            if (!key) {
                return new Response(JSON.stringify({ error: '缺少参数' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            await setConfigValue(key, '');
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ error: '无效的操作' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.error('Error in config API:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handlePreferredIPsAPI(request) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        
        if (action === 'get') {
            const preferredIPs = customPreferredIPs.map(ip => ({
                ip: ip.ip,
                port: ip.port,
                isp: ip.isp
            }));
            
            const preferredDomains = customPreferredDomains.map(domain => ({
                domain: domain.domain,
                port: domain.port,
                name: domain.name
            }));
            
            return new Response(JSON.stringify({
                ips: preferredIPs,
                domains: preferredDomains,
                count: preferredIPs.length + preferredDomains.length
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else if (action === 'add') {
            const type = url.searchParams.get('type');
            const address = url.searchParams.get('address');
            const port = url.searchParams.get('port') || '443';
            const name = url.searchParams.get('name') || '';
            
            if (!type || !address) {
                return new Response(JSON.stringify({ error: '缺少参数' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            if (type === 'ip') {
                if (!isValidIP(address)) {
                    return new Response(JSON.stringify({ error: '无效的IP地址' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                customPreferredIPs.push({
                    ip: address,
                    port: parseInt(port),
                    isp: name || '自定义优选-' + address + ':' + port
                });
            } else if (type === 'domain') {
                if (!isValidDomain(address)) {
                    return new Response(JSON.stringify({ error: '无效的域名' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                customPreferredDomains.push({
                    domain: address,
                    port: parseInt(port),
                    name: name || '自定义优选-' + address + ':' + port
                });
            } else {
                return new Response(JSON.stringify({ error: '无效的类型' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            const yxValue = arrayToYx(customPreferredIPs, customPreferredDomains);
            await setConfigValue('yx', yxValue);
            
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else if (action === 'clear') {
            customPreferredIPs = [];
            customPreferredDomains = [];
            await setConfigValue('yx', '');
            
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ error: '无效的操作' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.error('Error in preferred IPs API:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleWsRequest(request) {
    try {
        const { 0: client, 1: server } = new WebSocketPair();
        
        server.accept();
        
        server.addEventListener('message', async (event) => {
            try {
                const data = event.data;
                
                if (typeof data === 'string') {
                    const message = JSON.parse(data);
                    
                    if (message.type === 'ping') {
                        server.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    }
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        });
        
        server.addEventListener('close', () => {
            console.log('WebSocket closed');
        });
        
        return new Response(null, {
            status: 101,
            headers: {
                'Upgrade': 'websocket',
                'Connection': 'Upgrade'
            }
        });
    } catch (error) {
        console.error('WebSocket error:', error);
        return new Response('WebSocket Error', { status: 500 });
    }
}

async function handleXhttpPost(request) {
    try {
        const body = await request.arrayBuffer();
        
        if (body.byteLength === 0) {
            return null;
        }
        
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        
        setTimeout(async () => {
            try {
                const encoder = new TextEncoder();
                const responseData = encoder.encode('XHTTP response');
                await writer.write(responseData);
                await writer.close();
            } catch (error) {
                console.error('XHTTP write error:', error);
                try {
                    await writer.close();
                } catch (e) {}
            }
        }, 100);
        
        return { readable, closed: writer.closed };
    } catch (error) {
        console.error('XHTTP error:', error);
        return null;
    }
}

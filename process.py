# 在文件开头添加导入
import os
import re
import json
import base64
import socket
import requests
import time
import concurrent.futures
from urllib.parse import urlparse, unquote

# 配置
TIMEOUT = 3  # 测速超时
MAX_WORKERS = 20  # 并发数
GEO_API_URL = "http://ip-api.com/batch"

class NodeProcessor:
    def __init__(self):
        self.nodes = []
        self.runner_info = {}
    
    def get_subscribe_urls(self):
        """获取订阅链接，优先从本地文件，其次从环境变量"""
        urls = []
        
        # 1. 尝试读取本地 urls.txt 文件
        if os.path.exists("urls.txt"):
            try:
                with open("urls.txt", "r", encoding='utf-8') as f:
                    urls = [line.strip() for line in f if line.strip()]
                print(f"[*] 从本地 urls.txt 读取到 {len(urls)} 个订阅链接")
            except Exception as e:
                print(f"[!] 读取 urls.txt 失败: {e}")
        
        # 2. 如果本地文件为空或不存在，尝试环境变量
        if not urls:
            # 尝试多个可能的环境变量名称
            env_vars = ["SUBSCRIBE_URL", "SUBSCRIPTION_LINK", "SUB_URL"]
            for env_var in env_vars:
                url = os.environ.get(env_var)
                if url:
                    urls = [url]
                    print(f"[*] 从环境变量 {env_var} 读取订阅链接")
                    break
        
        if not urls:
            print("[!] 未找到任何订阅链接")
            print("[!] 请创建 urls.txt 文件或设置 SUBSCRIBE_URL 环境变量")
        
        return urls

    def get_runner_info(self):
        """获取 GitHub Runner 节点信息"""
        try:
            r = requests.get("http://ip-api.com/json/", timeout=5)
            self.runner_info = r.json()
            print(f"[*] Runner 位置: {self.runner_info.get('country')} - {self.runner_info.get('city')}")
        except Exception as e:
            print(f"[!] 获取 Runner 信息失败: {e}")
            self.runner_info = {
                "query": "Unknown", 
                "country": "Unknown",
                "city": "Unknown",
                "isp": "Unknown",
                "region": "Unknown",
                "timezone": "Unknown"
            }

    def decode_base64(self, data):
        """兼容各种长度的 Base64 解码"""
        try:
            # 移除可能的换行符和空格
            data = data.strip()
            # 补全 padding
            missing_padding = len(data) % 4
            if missing_padding:
                data += '=' * (4 - missing_padding)
            decoded = base64.b64decode(data).decode('utf-8')
            return decoded
        except Exception as e:
            print(f"[!] Base64 解码失败: {e}")
            return ""

    def parse_subscription(self, content):
        """解析订阅内容，识别各种协议"""
        decoded = self.decode_base64(content)
        if not decoded:
            return []
        
        lines = decoded.splitlines()
        extracted = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            try:
                # 识别协议
                if '://' not in line:
                    continue
                
                protocol = line.split('://')[0].lower()
                name = "未命名节点"
                address = ""
                port = 443
                
                # 提取名称（如果有 # 号）
                if '#' in line:
                    name_part = line.split('#')[1]
                    name = unquote(name_part)
                
                # 根据协议解析地址和端口
                if protocol in ['vmess', 'vless', 'trojan', 'ss', 'ssr']:
                    # 对于这些协议，地址通常在 @ 之后
                    if '@' in line:
                        host_part = line.split('@')[1].split('#')[0].split('?')[0]
                        if ':' in host_part:
                            address = host_part.split(':')[0]
                            port_str = host_part.split(':')[1]
                            if '/' in port_str:
                                port_str = port_str.split('/')[0]
                            port = int(port_str)
                
                if address and port:
                    extracted.append({
                        "name": name,
                        "address": address,
                        "port": port,
                        "protocol": protocol,
                        "raw": line,  # 保存原始链接用于复制
                        "latency": -1,  # 初始延迟
                        "country": "Unknown",
                        "city": "Unknown",
                        "isp": "Unknown",
                        "status": "pending"
                    })
                    
            except Exception as e:
                print(f"[!] 解析节点失败: {line[:50]}... - {e}")
                continue
        
        return extracted

    def test_latency(self, node):
        """TCP 握手测速"""
        start_time = time.time()
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(TIMEOUT)
            sock.connect((node['address'], node['port']))
            sock.close()
            latency = int((time.time() - start_time) * 1000)
            node['latency'] = latency
            node['status'] = 'active'
            return node
        except Exception as e:
            node['latency'] = -1
            node['status'] = 'failed'
            return None

    def get_geo_info(self, ips):
        """批量获取地理位置信息"""
        geo_data = {}
        if not ips:
            return geo_data
        
        # 去重
        unique_ips = list(set(ips))
        print(f"[*] 需要查询 {len(unique_ips)} 个 IP 的地理位置")
        
        # 分块处理（IP-API 限制每批 100 个）
        for i in range(0, len(unique_ips), 100):
            batch = unique_ips[i:i+100]
            try:
                print(f"[*] 查询第 {i//100 + 1} 批 IP ({len(batch)} 个)")
                r = requests.post(GEO_API_URL, json=batch, timeout=10)
                if r.status_code == 200:
                    results = r.json()
                    for item in results:
                        if 'query' in item:
                            geo_data[item['query']] = item
                else:
                    print(f"[!] 地理位置查询失败: HTTP {r.status_code}")
            except Exception as e:
                print(f"[!] 地理位置查询异常: {e}")
            
            # 礼貌等待，避免触发 API 限制
            if i + 100 < len(unique_ips):
                time.sleep(1)
        
        return geo_data

    def process(self):
        """主处理流程"""
        print("=" * 50)
        print("[*] 开始节点处理流程")
        print("=" * 50)
        
        # 获取订阅链接
        urls = self.get_subscribe_urls()
        if not urls:
            return
        
        # 获取 Runner 信息
        self.get_runner_info()
        
        all_nodes = []
        
        # 处理每个订阅链接
        for url in urls:
            print(f"[*] 处理订阅: {url[:50]}...")
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
                resp = requests.get(url, headers=headers, timeout=15)
                if resp.status_code != 200:
                    print(f"[!] 订阅请求失败: HTTP {resp.status_code}")
                    continue
                
                raw_nodes = self.parse_subscription(resp.text)
                print(f"[*] 解析到 {len(raw_nodes)} 个节点")
                all_nodes.extend(raw_nodes)
                
            except Exception as e:
                print(f"[!] 处理订阅失败: {e}")
                continue
        
        if not all_nodes:
            print("[!] 未解析到任何有效节点")
            return
        
        print(f"[*] 总共发现 {len(all_nodes)} 个节点，开始测速...")
        
        # 并发测速
        valid_nodes = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(self.test_latency, node): node for node in all_nodes}
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result and result['latency'] > 0:
                    valid_nodes.append(result)
        
        print(f"[*] 测速完成，有效节点: {len(valid_nodes)}/{len(all_nodes)}")
        
        # 收集需要查询地理位置的 IP
        ips_to_query = []
        for node in valid_nodes:
            # 只查询 IP 地址，跳过域名
            if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', node['address']):
                ips_to_query.append(node['address'])
        
        # 获取地理位置信息
        geo_data = self.get_geo_info(ips_to_query)
        
        # 整合地理位置信息
        for node in valid_nodes:
            ip = node['address']
            if ip in geo_data:
                geo = geo_data[ip]
                node['country'] = geo.get('country', 'Unknown')
                node['city'] = geo.get('city', 'Unknown')
                node['isp'] = geo.get('isp', 'Unknown')
                node['region'] = geo.get('regionName', 'Unknown')
                node['timezone'] = geo.get('timezone', 'Unknown')
                # 国家代码用于国旗显示
                node['flag'] = geo.get('countryCode', '').lower()
        
        # 排序：先按国家，再按延迟
        valid_nodes.sort(key=lambda x: (x.get('country', 'Unknown'), x.get('latency', 9999)))
        
        # 计算统计信息
        total_latency = sum(node['latency'] for node in valid_nodes)
        avg_latency = total_latency // len(valid_nodes) if valid_nodes else 0
        countries = sorted(set(node.get('country', 'Unknown') for node in valid_nodes))
        
        # 准备输出数据
        output = {
            "server_info": {
                "ip": self.runner_info.get("query", "Unknown"),
                "country": self.runner_info.get("country", "Unknown"),
                "city": self.runner_info.get("city", "Unknown"),
                "isp": self.runner_info.get("isp", "Unknown"),
                "region": self.runner_info.get("regionName", "Unknown"),
                "timezone": self.runner_info.get("timezone", "Unknown"),
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            },
            "nodes": valid_nodes,
            "statistics": {
                "total_nodes": len(all_nodes),
                "active_nodes": len(valid_nodes),
                "average_latency": avg_latency,
                "countries": countries,
                "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
        }
        
        # 保存到文件
        with open("nodes.json", "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print("=" * 50)
        print("[+] 处理完成!")
        print(f"[+] 总节点: {len(all_nodes)}")
        print(f"[+] 有效节点: {len(valid_nodes)}")
        print(f"[+] 平均延迟: {avg_latency}ms")
        print(f"[+] 覆盖国家: {len(countries)}")
        print(f"[+] 数据已保存到 nodes.json")
        print("=" * 50)

if __name__ == "__main__":
    processor = NodeProcessor()
    processor.process()
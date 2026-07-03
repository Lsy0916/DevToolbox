export interface SiteConfig {
  name: string
  version: string
  repository: string
  license: {
    type: string
    url: string
  }
}

/** 站点配置实例 */
export const siteConfig: SiteConfig = {
  name: 'DevToolbox',
  version: '1.0.0',
  repository: 'https://github.com/Lsy0916/DevToolbox',
  license: {
    type: 'custom-non-commercial',
    url: '/license',
  },
}

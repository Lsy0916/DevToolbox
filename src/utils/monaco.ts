/**
 * Monaco Editor Worker 配置
 *
 * Monaco Editor 在浏览器中使用 Web Worker 进行语法分析、补全等后台计算，
 * 避免阻塞主线程。Vite 通过 `?worker` 后缀将 worker 文件作为独立 chunk 打包。
 *
 * 此文件根据语言标签（label）返回对应的 worker 实例：
 * - json: JSON 语言服务 worker（语法校验、补全）
 * - html: HTML 语言服务 worker
 * - typescript/javascript: TS/JS 语言服务 worker（类型检查、补全）
 * - 其他: 通用编辑器 worker（基础编辑功能）
 */
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// 配置 Monaco 的 worker 工厂，运行时按语言标签创建对应 worker
self.MonacoEnvironment = {
  getWorker(_moduleId: string, label: string): Worker {
    switch (label) {
      case 'json':
        return new jsonWorker()
      case 'html':
        return new htmlWorker()
      case 'typescript':
      case 'javascript':
        return new tsWorker()
      default:
        return new editorWorker()
    }
  },
}

export { monaco }

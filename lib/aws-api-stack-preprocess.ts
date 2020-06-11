import * as child_process from 'child_process'

export class PreProcess {
  public static BUNDLE_LAYER_BASE_DIR = process.cwd() + '/bundle'
  public static BUNDLE_LAYER_RUNTIME_DIR_NAME = '/nodejs'

  public static generateBundlePackage() {
    console.log(
      child_process
        .execSync(`npm --prefix ${this.getModuleInstallDir()} install ${this.getModuleInstallDir()}`)
        .toString(),
    )
  }

  private static getModuleInstallDir(): string {
    return `${this.BUNDLE_LAYER_BASE_DIR}${this.BUNDLE_LAYER_RUNTIME_DIR_NAME}`
  }
}

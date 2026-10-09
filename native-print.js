(function(root){
  'use strict';
  async function print(name){
    if(root.Capacitor?.isNativePlatform?.()){
      const printer=root.Capacitor.registerPlugin?.('Printer');
      if(!printer?.printWebView)throw new Error('El módulo de impresión nativa no está disponible. Actualiza la app.');
      return printer.printWebView({name});
    }
    root.print();
  }
  root.ClinovyraPrint=Object.freeze({print});
})(window);

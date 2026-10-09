(function(root){
  'use strict';
  function plugin(){
    if(!root.Capacitor?.isNativePlatform?.())return null;
    return root.Capacitor.registerPlugin?.('NativeBiometric')||null;
  }
  async function available(){
    const native=plugin();
    if(!native)return false;
    const result=await native.isAvailable({useFallback:false});
    return result.isAvailable===true&&result.strongBiometryIsAvailable===true;
  }
  function requirePlugin(){const native=plugin();if(!native)throw new Error('La biometría nativa no está disponible en este dispositivo. Usa el PIN.');return native}
  async function protect(server,binding,key){
    await requirePlugin().setCredentials({server,username:binding,password:key,accessControl:1,authValidityDuration:0,title:'Proteger bóveda Clinovyra',negativeButtonText:'Cancelar'});
  }
  async function release(server){return requirePlugin().getSecureCredentials({server,reason:'Desbloquear la bóveda Clinovyra',title:'Desbloquear Clinovyra',subtitle:'Identidad biométrica',description:'Accede a tus expedientes cifrados',negativeButtonText:'Usar PIN'})}
  async function remove(server){return requirePlugin().deleteCredentials({server})}
  root.ClinovyraBiometric=Object.freeze({available,protect,release,remove,supported:()=>!!plugin()});
})(window);

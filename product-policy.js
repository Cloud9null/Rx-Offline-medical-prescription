(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ClinovyraPolicy=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  // This deployment is the owner's personal edition. A commercial deployment
  // must also enforce these rules in a tenant-scoped transaction on the server.
  const edition='personal';
  function isCommercial(){return edition==='saas'}
  function validatePrescription({mode=edition,patientId,context,emr}={}){
    if(mode!=='saas')return {ok:true};
    if(!context?.noteId||!context?.encounterId||context.patientId!==patientId)return {ok:false,reason:'Finaliza una nota clínica de este paciente y emite la receta desde esa nota.'};
    const note=emr?.clinicalNotes?.find(n=>n.id===context.noteId&&n.encounterId===context.encounterId&&n.patientId===patientId);
    const encounter=emr?.encounters?.find(e=>e.id===context.encounterId&&e.patientId===patientId);
    if(note?.status!=='final'||encounter?.status!=='final'||!note.canonicalText||!note.seal?.hash||!note.finalSnapshot)return {ok:false,reason:'La nota asociada debe estar finalizada, firmada y pertenecer a esta consulta.'};
    return {ok:true,noteHash:note.seal.hash};
  }
  return Object.freeze({edition,isCommercial,validatePrescription});
});

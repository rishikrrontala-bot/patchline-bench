#!/usr/bin/env python3
"""Offline checks for credential boundaries and accidental-repeat protection."""
import importlib.util, io, json, tempfile, unittest, urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('adaption_api',Path(__file__).with_name('adaption-api.py'))
api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)
class BoundaryTests(unittest.TestCase):
    def good_quote(self, data):
        return {'verified':True,'quotedTotalCredits':100,'configurationSha256':api.config_hash(data),'providerEvidence':'Provider order summary screenshot','observedAt':datetime.now(timezone.utc).isoformat()}
    def test_quote_accepts_exact_current_bounded_configuration(self):
        data={'model':'test'};api.validate_quote(data,self.good_quote(data))
    def test_quote_rejects_overcap_bool_nonfinite_or_unverified(self):
        data={'model':'test'}
        for credits in [101,True,float('nan'),float('inf'),None,-1]:
            q=self.good_quote(data);q['quotedTotalCredits']=credits
            with self.assertRaises(RuntimeError):api.validate_quote(data,q)
        q=self.good_quote(data);q['verified']=False
        with self.assertRaises(RuntimeError):api.validate_quote(data,q)
    def test_quote_rejects_recipe_change_or_stale_evidence(self):
        data={'model':'test'};q=self.good_quote(data)
        with self.assertRaises(RuntimeError):api.validate_quote({'model':'different'},q)
        q['observedAt']=(datetime.now(timezone.utc)-timedelta(hours=3)).isoformat()
        with self.assertRaises(RuntimeError):api.validate_quote(data,q)
    def test_missing_quote_cannot_call_provider(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(api,'PROOF',Path(directory)),patch.object(api,'proposal',return_value={}),patch.object(api,'request') as call:
                with self.assertRaisesRegex(RuntimeError,'quote is missing'):api.launch()
                call.assert_not_called()
    def test_raw_options_are_source_nested(self):
        payload=api.raw_upload_payload()
        self.assertEqual(set(payload),{'source'})
        self.assertEqual(payload['source']['processing_mode'],'raw')
        self.assertEqual(payload['source']['column_mapping'],{'prompt':'prompt','completion':'completion'})
    def test_redirect_is_refused(self):
        with self.assertRaisesRegex(RuntimeError,'Redirect refused'):
            api.NoRedirect().redirect_request(None,None,302,'',{},'https://other.example/')
    def test_tls_uses_platform_trust_when_macos_bundle_is_absent(self):
        with patch.object(api.Path,"is_file",return_value=False),patch.object(api.ssl,"create_default_context") as create:
            api.tls_context();create.assert_called_once_with()

    def test_http_error_redacts_key(self):
        secret='PRIVATE_TEST_CREDENTIAL'
        error=urllib.error.HTTPError(api.BASE+'datasets',401,'',{},io.BytesIO(('Rejected '+secret).encode()))
        class Opener:
            def open(self,*args,**kwargs):raise error
        with patch.object(api,'credential',return_value=secret),patch.object(api.urllib.request,'build_opener',return_value=Opener()):
            with self.assertRaises(RuntimeError) as result:api.request('datasets')
        self.assertNotIn(secret,str(result.exception));self.assertIn('[omitted]',str(result.exception))
    def test_repeat_upload_never_calls_provider(self):
        with tempfile.TemporaryDirectory() as directory:
            proof=Path(directory);(proof/'adaption-raw-state.json').write_text('{}')
            with patch.object(api,'PROOF',proof),patch.object(api,'request') as call,patch('builtins.print'):
                api.upload();call.assert_not_called()
    def test_summary_omits_account_and_download_fields(self):
        result=api.dataset_summary({'dataset_id':'example','created_by_user_id':'private-id','download_url':'https://private.example/token'})
        self.assertNotIn('created_by_user_id',result);self.assertNotIn('download_url',result)
if __name__=='__main__': unittest.main()

exports.handler = async (event: any, context: any) => {
  //Get contents of response
   const response = event.Records[0].cf.response;
   const headers = response.headers;

   //Set new headers 
   headers['x-frame-options'] = [{key: 'X-Frame-Options', value: 'DENY'}]; 
   
   //Return modified response
   return response;
};
import getFolderAndFileName from './getFolderAndFileName';

const serveFile = (folder: string, file: string) => `/api/serve/file/${folder}/${file}`;

function createUrlFile(path: string, service: 'restaurant' | 'erp' | 'delivery' | 'client' | 'backend') {
    let base_url = '';
    let url: string = '';
    const { folderName, fileName } = getFolderAndFileName(path);
    if (service === 'restaurant') {
        base_url = "https://resto.turbodeliveryapp.com";
        url = base_url + serveFile(folderName, fileName);
    }
    if (service === 'erp') {
        base_url = process.env.NEXT_PUBLIC_API_ERP_URL ?? '';
        url = base_url + serveFile(folderName, fileName);
    }
    if (service === 'delivery') {
        base_url = process.env.NEXT_PUBLIC_API_DELIVERY_URL ?? '';
        url = base_url + serveFile(folderName, fileName);
    }
    if (service === 'client') {
        base_url = process.env.NEXT_PUBLIC_API_CLIENT_URL ?? '';
        url = base_url + serveFile(folderName, fileName);
    }
    if (service === 'backend') {
        base_url = process.env.NEXT_PUBLIC_API_BACKEND_URL ?? '';
        url = base_url + `/api/upload/${fileName}`;   
    }
    return url;
}

export default createUrlFile;

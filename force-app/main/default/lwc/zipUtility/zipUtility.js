import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import extractZip from '@salesforce/apex/ZipFileController.extractZip';
import compressFiles from '@salesforce/apex/ZipFileController.compressFiles';

export default class ZipUtility extends LightningElement {
    @track fileList = [];
    @track uploadedFileIds = [];
    @track uploadedFileNames = [];

    isExtractDisabled = true;
    isCompressDisabled = true;
    isDownloadDisabled = true;
    isLoading = false;
    // Accepted file formats for upload
    acceptedFormats = ['.zip', '.txt', '.docx', '.pdf', '.png', '.jpg', 
                        '.jpeg', '.csv', '.xlsx', '.pptx'];

    columns = [
        { label: 'File Name', fieldName: 'Title' },
        {
            label: 'Download',
            type: 'button',
            typeAttributes: {
                label: 'Download',
                name: 'download',
                variant: 'brand'
            }
        }
    ];

    handleUpload(event) {
        const uploadedFiles = event.detail.files;

        if (uploadedFiles.length === 0) {
            this.showToast('Error', 'No files uploaded.', 'error');
            return;
        }

        // Capture file names
        this.uploadedFileNames = uploadedFiles.map(f => f.name);
        this.uploadedFileIds = uploadedFiles.map(f => f.documentId);
        this.fileList = [];

        const isZip = this.isZipFileUploaded(uploadedFiles);
        this.isExtractDisabled = !uploadedFiles.length || !isZip;
        this.isCompressDisabled = isZip;
        this.isDownloadDisabled = true;

        this.showToast('Success', 'Files uploaded successfully.', 'success');
    }

    isZipFileUploaded(files) {
        return files.length === 1 && files[0].name.toLowerCase().endsWith('.zip');
    }


    async handleExtract() {
        this.isLoading = true;
        try {
            const result = await extractZip({ zipFileId: this.uploadedFileIds[0] });
            this.fileList = result.map(file => ({ ...file, id: file.Id }));
            this.isDownloadDisabled = false;
            this.showToast('Success', 'ZIP extracted successfully.', 'success');
        } catch (error) {
            this.showToast('Error', error.body.message, 'error');
            console.error(error);
        } finally {
            this.isLoading = false;
        }
    }

    async handleCompress() {
        this.isLoading = true;
        try {
            const result = await compressFiles({ fileIds: this.uploadedFileIds });
            this.fileList = [{ ...result, id: result.Id }];
            this.isDownloadDisabled = false;
            this.showToast('Success', 'Files compressed successfully.', 'success');
        } catch (error) {
            this.showToast('Error', error.body.message, 'error');
            console.error(error);
        } finally {
            this.isLoading = false;
        }
    }

    handleDownloadAll() {
        this.fileList.forEach(file => {
            window.open(`/sfc/servlet.shepherd/version/download/${file.Id}`, '_blank');
        });
    }

    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;

        if (action.name === 'download') {
            window.open(`/sfc/servlet.shepherd/version/download/${row.Id}`, '_blank');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant,
            mode: 'dismissable'
        }));
    }

    get numberedFileNames() {
        return this.uploadedFileNames.map((name, idx) => `${idx + 1}. ${name}`);
    }

}
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import { Grid, IconButton, List, ListItem, ListItemText, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { Fragment, useContext, useState } from 'react';
import { ExpandableListItem } from '../../../components/ExpandableListItem';
import defaultAxios from '../../../config/axiosConfig';
import { PlaidContext } from '../../../contexts/PlaidContext';
import { formatDate } from '../../../utils/function-utils';
import { themeColors } from '../../../utils/theme-utils';
import { PlaidLink } from '../../plaid/PlaidLink';
import { DeleteAccountDialog, DeleteAccountDialogProps } from './DeleteAccountDialog';
import { EditAccountsDialog, EditAccountsDialogProps } from './EditAccountsDialog';

const LinkAccountButton = ({ linkToken }: { linkToken: string | undefined }) => {
  if (!linkToken) return <Skeleton variant="text" sx={{ fontSize: '3rem', width: '100px' }} />;
  return <PlaidLink />;
};

const accountDialogDetailsUndefined = {
  item_id: '',
  name: '',
  created_at: '',
  linked_sub_accounts: [],
};

export const AccountsTab = () => {
  const { linkToken, linkedAccounts, linkedAccountLoading, linkedAccountError, linkedAccountRefetch } =
    useContext(PlaidContext);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined);

  const accountDialogDetails =
    linkedAccounts?.find((account) => account.item_id === selectedAccount) ?? accountDialogDetailsUndefined;

  const handleOpenEditDialog = (itemId: string) => {
    setOpenEditDialog(true);
    setSelectedAccount(itemId);
  };

  const handleCloseEditDialog: EditAccountsDialogProps['handleClose'] = async (payload) => {
    setOpenEditDialog(false);
    setSelectedAccount(undefined);
    if (payload?.accountName) {
      try {
        await defaultAxios.put('http://localhost:3000/api/update_account_name', payload);
      } catch (err) {
        console.error(err);
      } finally {
        linkedAccountRefetch();
      }
    }
  };

  const handleOpenDeleteDialog = (itemId: string) => {
    setOpenDeleteDialog(true);
    setSelectedAccount(itemId);
  };

  const handleCloseDeleteDialog: DeleteAccountDialogProps['handleClose'] = async (payload) => {
    setOpenDeleteDialog(false);
    setSelectedAccount(undefined);
    if (payload?.itemId) {
      try {
        await defaultAxios.post('http://localhost:3000/api/item/remove', payload);
      } catch (err) {
        console.error(err);
      } finally {
        linkedAccountRefetch();
      }
    }
  };

  if (linkedAccountLoading) return <Skeleton variant="rounded" width="400px" height="300px" />;
  if (linkedAccountError) {
    console.error(linkedAccountError);
    return <div>Error: {linkedAccountError.message}</div>;
  }
  // FIXUI - Fix the UI for nested items
  // Move the expand and collapse button to the left of the institution name
  return (
    <>
      <Stack direction="column" justifyContent="center" alignItems="flex-end" spacing={2}>
        <LinkAccountButton linkToken={linkToken} />
        {linkedAccounts?.length ? (
          <Paper
            variant="outlined"
            sx={{
              width: '400px',
            }}
          >
            <EditAccountsDialog
              open={openEditDialog}
              handleClose={handleCloseEditDialog}
              accountDetails={accountDialogDetails}
            />
            <DeleteAccountDialog
              open={openDeleteDialog}
              handleClose={handleCloseDeleteDialog}
              accountDetails={accountDialogDetails}
            />
            {linkedAccounts?.map((account) => (
              <Fragment key={account.item_id}>
                <List>
                  <ListItem>
                    <Grid container direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Grid item>
                        <ExpandableListItem
                          primaryText={account.alias_name ? account.alias_name : account.name}
                          secondaryText={formatDate(account.created_at)}
                          nestedItems={account.linked_sub_accounts?.map((subAccount) => (
                            <Stack
                              key={subAccount.account_id}
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <ListItemText primary={subAccount.alias_name ? subAccount.alias_name : subAccount.name} />
                              <ListItemText primary={`$${subAccount.balance}`} />
                            </Stack>
                          ))}
                        />
                      </Grid>
                      <Grid item>
                        <IconButton onClick={() => handleOpenEditDialog(account.item_id)}>
                          <EditIcon sx={{ color: themeColors.greyText }} />
                        </IconButton>
                        <IconButton onClick={() => handleOpenDeleteDialog(account.item_id)}>
                          <CancelIcon sx={{ color: themeColors.danger }} />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </ListItem>
                </List>
              </Fragment>
            ))}
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ width: '400px', height: '200px' }}>
            <Grid container direction="row" justifyContent="center" alignItems="center" height="100%">
              <Typography variant="h3"> No linked accounts</Typography>
            </Grid>
          </Paper>
        )}
      </Stack>
    </>
  );
};
